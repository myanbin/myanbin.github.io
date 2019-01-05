---
layout: post
title: '如何启用 OpenLDAP 的 memberOf 特性'
tags: [code]
---

之前的文章中，我们已经安装部署了 [OpenLDAP 服务]({{site.baseurl}}{% link _posts/2018-01-02-openldap-in-centos-7.md %})。所以本文将主要介绍如何启用 OpenLDAP 中非常有用的 memberOf 特性。

很多场景下，我们需要快速的查询某一个用户是属于哪一个或多个组的（member of）。memberOf 正是提供了这样的一个功能：如果某个组中通过 `member` 属性新增了一个用户，OpenLDAP 便会自动在该用户上创建一个 `memberOf` 属性，其值为该组的 dn。

遗憾的是，OpenLDAP 默认并不启用这个特性，因此我们需要通过相关的配置开启它。


## 一、配置 OpenLDAP Backend

为了启用 OpenLDAP 的 memberOf 特性，我们首先需要在 OpenLDAP 服务器上创建如下两个文件：

```yaml
# backend.memberof.ldif
dn: cn=module,cn=config
cn: module
objectclass: olcModuleList
objectclass: top
olcmoduleload: memberof
olcmodulepath: /usr/lib/ldap

dn: olcOverlay={0}memberof,olcDatabase={2}mdb,cn=config
objectClass: olcConfig
objectClass: olcMemberOf
objectClass: olcOverlayConfig
objectClass: top
olcOverlay: memberof
```

```yaml
# backend.refint.ldif
dn: cn=module,cn=config
cn: module
objectclass: olcModuleList
objectclass: top
olcmoduleload: refint
olcmodulepath: /usr/lib/ldap

dn: olcOverlay={1}refint,olcDatabase={2}mdb,cn=config
objectClass: olcConfig
objectClass: olcMemberOf
objectClass: olcOverlayConfig
objectClass: top
olcOverlay: refint
```

接着使用 `ldapadd` 命令将其导入：

```terminal
$ ldapadd -Y EXTERNAL -H ldapi:/// -f ./backend.memberof.ldif
$ ldapadd -Y EXTERNAL -H ldapi:/// -f ./backend.refint.ldif
$ ldapadd -Y EXTERNAL -H ldapi:/// -f ./backend.remote_access.ldif
```


## 二、导入用户和组数据

首先我们向 OpenLDAP 导入一个用户：

```terminal
$ vim add_user.ldif
dn: uid=john,ou=people,dc=xinhua,dc=io
cn: John Doe
givenName: John
sn: Doe
uid: john
uidNumber: 5000
gidNumber: 1000
userPassword: {SHA}M6XDJwA47cNw9gm5kXV1uTQuMoY=
homeDirectory: /home/john
mail: john.doe@example.com
objectClass: top
objectClass: posixAccount
objectClass: inetOrgPerson

$ ldapadd -x -H ldap://172.16.168.120 -D "cn=admin,dc=xinhua,dc=io" -W -f ./add_user.ldif
```

然后再导入一个组：

```terminal
$ vim add_group.ldif
dn: cn=master,ou=group,dc=xinhua,dc=io
objectClass: groupOfNames
cn: master
member: uid=john,ou=people,dc=xinhua,dc=io

$ ldapadd -x -H ldap://172.16.168.120 -D "cn=admin,dc=xinhua,dc=io" -W -f ./add_group.ldif
```

最后通过 `ldapsearch` 命令可以查询到，该用户属性中已经增加了 `memberOf`：

```terminal
$ ldapsearch -x -H ldap://172.16.168.120 -b dc=xinhua,dc=io -D "cn=admin,dc=xinhua,dc=io" -W memberOf
dn: uid=john,ou=people,dc=xinhua,dc=io
memberOf: cn=master,ou=group,dc=xinhua,dc=io
```

最终，我们在 OpenLDAP 中实现了对 memberOf 的支持。
