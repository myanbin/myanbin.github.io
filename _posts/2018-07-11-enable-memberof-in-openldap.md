---
layout: post
title: '如何启用 OpenLDAP 的 memberOf 特性'
tags: [code]
---

之前，我们已经通过 Docker 的方式安装部署了 [OpenLDAP 服务]({{site.baseurl}}{% link _posts/2018-01-02-openldap-in-centos-7.md %})。所以本文将主要介绍如何启用 OpenLDAP 中非常有用的 memberOf 特性。

很多场景下，我们需要快速的查询某一个用户是属于哪一个或多个组的（member of）。memberOf 正是提供了这样的一个功能：如果某个组中通过 `member` 属性新增了一个用户，OpenLDAP 便会自动在该用户上创建一个 `memberOf` 属性，其值为该组的 dn。

遗憾的是，OpenLDAP 默认并不启用这个特性，因此我们需要通过相关的配置开启它。


## 一、创建一个支持 memberOf 的 Docker 镜像

我们的思路是以 [osixia/openldap](https://github.com/osixia/docker-openldap) 为基准，通过 Dockerfile 来扩展其启动脚本，来实现对 memberOf 的支持。

首先，我们需要修改原镜像中的 `bootstrap/ldif/03-memberOf.ldif` 脚本中的 `olcMemberOfGroupOC` 和 `olcMemberOfMemberAD` 属性，结果如下：

```yaml
# Load memberof module
dn: cn=module{0},cn=config
changetype: modify
add: olcModuleLoad
olcModuleLoad: memberof

# Backend memberOf overlay
dn: olcOverlay={0}memberof,olcDatabase={1}{{ LDAP_BACKEND }},cn=config
changetype: add
objectClass: olcOverlayConfig
objectClass: olcMemberOf
olcOverlay: {0}memberof
olcMemberOfDangling: ignore
olcMemberOfRefInt: TRUE
olcMemberOfGroupOC: groupOfNames
olcMemberOfMemberAD: member
olcMemberOfMemberOfAD: memberOf
```

接着我们来创建一个如下的 Dockerfile，将修改后的脚本文件加入到新的镜像中：

```dockerfile
FROM osixia/openldap
LABEL maintainer "Ma Yanbin <myanbin@gmail.com>"

ENV LDAP_ORGANISATION="XINHUA.IO" LDAP_DOMAIN="xinhua.io" LDAP_ADMIN_PASSWORD="Passw0rd"

ADD bootstrap /container/service/slapd/assets/config/bootstrap
```

然后通过如下命令，便可以构建出新的镜像 myanbin/openldap：

```terminal
$ docker build -t myanbin/openldap:0.1.0 .
```

最后运行此镜像即可：

```terminal
$ docker run --name ldap_core -p 389:389 -p 636:636 --detach myanbin/openldap
```


## 二、使用 LDIF 文件导入用户和组数据

首先我们导入一个用户：

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
