---
layout: post
title: 'CentOS 7 环境下 OpenLDAP 的安装与配置'
tags: [code]
---


![开发协作平台总体架构图]({{site.img_url}}/2018-architecture.png){:.center}

最近，自主研发团队正在搭建一套基于 LDAP 统一认证的开发协作平台（包括代码托管服务 GitLab、私有 npm 服务 CNPM 等），以便达到用户统一管理、统一授权的效果。在这期间，我们阅读和参考了许多优秀的文档和资料，同时也遇到了一些知识瓶颈和技术难题，但最终顺利地完成了该平台搭建。因此我们认为有必要把这些经验整理和汇总成一些文档和笔记并分享出来，以使后来有需要的人参考使用，并践行开源自由之精神。

本文是该系列的第一篇，主要介绍了 LDAP 的基本概念，以及在 CentOS 7 环境下 OpenLDAP 的安装步骤及配置，最后会介绍如何通过 phpLDAPadmin 来管理 LDAP 服务。关于 GitLab 和 CNPM 的安装和配置，请阅读：

* [如何搭建一个基于 LDAP 认证的 GitLab 服务]({{site.baseurl}}{% link _posts/2018-01-05-installing-gitlab-with-ldap-authentication.md %})
* [使用 CNPM 搭建私有 npm 仓库]({{site.baseurl}}{% link _posts/2018-01-10-npm-private-registry.md %})

## 一、LDAP 基础教程

LDAP 全称轻量级目录访问协议（英文：Lightweight Directory Access Protocol），是一个运行在 TCP/IP 上的目录访问协议。目录是一个特殊的数据库，它的数据经常被查询，但是不经常更新。其专门针对读取、浏览和搜索操作进行了特定的优化。目录一般用来包含描述性的，基于属性的信息并支持精细复杂的过滤能力。比如 DNS 协议便是一种最被广泛使用的目录服务。

LDAP 中的信息按照目录信息树结构组织，树中的一个节点称之为条目（Entry），条目包含了该节点的属性及属性值。条目都可以通过识别名 dn 来全局的唯一确定[^1]，可以类比于关系型数据库中的主键。比如 dn 为 `uid=ada,ou=people,dc=xinhua,dc=io` 的条目表示在组织中一个名字叫做 Ada Catherine 的员工，其中 `uid=ada` 也被称作相对区别名 rdn。

一个条目的属性通过 LDAP 元数据模型（Scheme）中的对象类（objectClass）所定义，下面的表格列举了对象类 inetOrgPerson（Internet Organizational Person）中的一些必填属性和可选属性。

| 属性名        | 是否必填 | 描述                                     |
| ------------- | :------: | --------------------------------------- |
| `cn`          | 是       | 该条目被人所熟知的通用名（Common Name）  |
| `sn`          | 是       | 该条目的姓氏                            |
| `o`           | 否       | 该条目所属的组织名（Organization Name）  |
| `mobile`      | 否       | 该条目的手机号码                        |
| `description` | 否       | 该条目的描述信息                        |

下面是一个典型的 LDAP 目录树结构，其中每个节点表示一个条目。在下一节中，我们将按照这个结构来配置一个简单的 LDAP 服务。

![一个典型的 LDAP 目录树]({{site.img_url}}/2018-ldap-tree.png){:.center}

## 二、OpenLDAP 的安装和配置

本文中相关操作系统及依赖包的版本如下：

* centos-release-7-4.1708.el7.centos.x86_64
* openldap-clients-2.4.44-5.el7.x86_64：包含客户端程序，用来访问和修改 OpenLDAP 目录
* openldap-servers-2.4.44-5.el7.x86_64：包含主 LDAP 服务器 slapd 和同步服务器 slurpd 服务器、迁移脚本和相关文件

第一步，需要切换到 root 账号来安装 OpenLDAP 相关程序包，并启动服务：

```terminal
$ yum install -y openldap-servers openldap-clients
$ cp /usr/share/openldap-servers/DB_CONFIG.example /var/lib/ldap/DB_CONFIG
$ chown ldap. /var/lib/ldap/DB_CONFIG
$ systemctl enable slapd
$ systemctl start slapd
```

第二步，我们使用 `slappasswd` 命令来生成一个密码，并使用 LDIF（LDAP 数据交换格式）文件将其导入到 LDAP 中来配置管理员密码：

```terminal
$ slappasswd
New password:
Re-enter new password:
{SSHA}KS/bFZ8KTmO56khHjJvM97l7zivH1MwG

$ vim chrootpw.ldif
# specify the password generated above for "olcRootPW" section
dn: olcDatabase={0}config,cn=config
changetype: modify
add: olcRootPW
olcRootPW: {SSHA}KS/bFZ8KTmO56khHjJvM97l7zivH1MwG

$ ldapadd -Y EXTERNAL -H ldapi:/// -f chrootpw.ldif
```

第三步，我们需要向 LDAP 中导入一些基本的 Schema。这些 Schema 文件位于 `/etc/openldap/schema/` 目录中，定义了我们以后创建的条目可以使用哪些属性：

```terminal
$ ldapadd -Y EXTERNAL -H ldapi:/// -f /etc/openldap/schema/core.ldif
$ ldapadd -Y EXTERNAL -H ldapi:/// -f /etc/openldap/schema/cosine.ldif
$ ldapadd -Y EXTERNAL -H ldapi:/// -f /etc/openldap/schema/nis.ldif
$ ldapadd -Y EXTERNAL -H ldapi:/// -f /etc/openldap/schema/inetorgperson.ldif
```

第四步，我们需要配置 LDAP 的顶级域（以 `dc=xinhua,dc=io` 为例）及其管理域：

```terminal
$ slappasswd
New password:
Re-enter new password:
{SSHA}z/rsbmAjVtLlWeUB0xS5itLPI0VA1akD

$ vim chdomain.ldif
# replace to your own domain name for "dc=***,dc=***" section
# specify the password generated above for "olcRootPW" section
dn: olcDatabase={1}monitor,cn=config
changetype: modify
replace: olcAccess
olcAccess: {0}to * by dn.base="gidNumber=0+uidNumber=0,cn=peercred,cn=external,cn=auth"
  read by dn.base="cn=admin,dc=xinhua,dc=io" read by * none

dn: olcDatabase={2}mdb,cn=config
changetype: modify
replace: olcSuffix
olcSuffix: dc=xinhua,dc=io

dn: olcDatabase={2}mdb,cn=config
changetype: modify
replace: olcRootDN
olcRootDN: cn=admin,dc=xinhua,dc=io

dn: olcDatabase={2}mdb,cn=config
changetype: modify
add: olcRootPW
olcRootPW: {SSHA}z/rsbmAjVtLlWeUB0xS5itLPI0VA1akD

dn: olcDatabase={2}mdb,cn=config
changetype: modify
add: olcAccess
olcAccess: {0}to attrs=userPassword,shadowLastChange by
  dn="cn=admin,dc=xinhua,dc=io" write by anonymous auth by self write by * none
olcAccess: {1}to dn.base="" by * read
olcAccess: {2}to * by dn="cn=admin,dc=xinhua,dc=io" write by * read

$ ldapmodify -Y EXTERNAL -H ldapi:/// -f chdomain.ldif
```

第五步，在上述基础上，我们来创建一个叫做 Xinhua News Agency 的组织，并在其下创建一个 Manager 的组织角色（该角色内的用户具有管理整个 LDAP 的权限）和 People 和 Group 两个组织单元：

```terminal
$ vim basedomain.ldif
# replace to your own domain name for "dc=***,dc=***" section
dn: dc=xinhua,dc=io
objectClass: top
objectClass: dcObject
objectclass: organization
o: XINHUA.IO
dc: xinhua

dn: cn=admin,dc=xinhua,dc=io
objectClass: organizationalRole
cn: Manager

dn: ou=people,dc=xinhua,dc=io
objectClass: organizationalUnit
ou: people

dn: ou=group,dc=xinhua,dc=io
objectClass: organizationalUnit
ou: group

$ ldapadd -x -D cn=admin,dc=xinhua,dc=io -W -f basedomain.ldif
```

通过以上的所有步骤，我们就设置好了一个 LDAP 目录树：其中基准 dn `dc=xinhua,dc=io` 是该树的根节点，其下有一个管理域 `cn=admin,dc=xinhua,dc=io` 和两个组织单元 `ou=people,dc=xinhua,dc=io` 及 `ou=group,dc=xinhua,dc=io`。

接下来，我们来创建一个叫作 Ada Catherine 的员工并将其分配到 Secretary 组来验证上述配置是否生效。

```terminal
$ slappasswd
New password:
Re-enter new password:
{SSHA}HTGqAd4p6fOOIVHm7VZYUSorWGfnrqAA

$ vim ldapuser.ldif
# create new
# replace to your own domain name for "dc=***,dc=***" section
dn: uid=ada,ou=people,dc=xinhua,dc=io
objectClass: inetOrgPerson
objectClass: posixAccount
objectClass: shadowAccount
uid: ada
cn: Ada Catherine
sn: Catherine
userPassword: {SSHA}HTGqAd4p6fOOIVHm7VZYUSorWGfnrqAA
loginShell: /bin/bash
uidNumber: 1000
gidNumber: 1000
homeDirectory: /home/users/ada

dn: cn=Secretary,ou=group,dc=xinhua,dc=io
objectClass: posixGroup
cn: Secretary
gidNumber: 1000
memberUid: ada

# ldapadd -x -D cn=admin,dc=xinhua,dc=io -W -f ldapuser.ldif
Enter LDAP Password:
adding new entry "uid=ada,ou=People,dc=xinhua,dc=org"
adding new entry "cn=Secretary,ou=Group,dc=xinhua,dc=org"
```

我们也可以使用 `ldapsearch` 命令来查看 LDAP 目录服务中的所有条目信息：

```terminal
$ ldapsearch -x -b "dc=xinhua,dc=io" -H ldap://127.0.0.1
# extended LDIF
#
# LDAPv3
# base <dc=xinhua,dc=io> with scope subtree
# filter: (objectclass=*)
# requesting: ALL
#

# xinhua.org
dn: dc=xinhua,dc=io
objectClass: top
objectClass: dcObject
objectClass: organization
o: Xinhua News Agency
dc: xinhua
...
```

如果要删除一个条目，可以按下面的命令操作：

```sh
$ ldapdelete -x -W -D 'cn=admin,dc=xinhua,dc=io' "uid=ada,ou=People,dc=xinhua,dc=io"
```

## 三、使用 phpLDAPadmin 来管理 LDAP 服务

通过 LDIF 文件可以在终端上管理起整个 LDAP，但是我们都喜欢图形化界面。phpLDAPadmin 正是一个可以通过浏览器来管理 LDAP 服务的 Web 工具。

在安装 phpLDAPadmin 之前，要确保服务器上已经启动了 Apache httpd 服务及 PHP [^2]。准备就绪后，我们按下面的操作来安装和配置 phpLDAPadmin：

```terminal
$ yum -y install epel-release
$ yum --enablerepo=epel -y install phpldapadmin

$ vim /etc/phpldapadmin/config.php
# line 397: uncomment, line 398: comment out
$servers->setValue('login','attr','dn');
// $servers->setValue('login','attr','uid');

$ vim /etc/httpd/conf.d/phpldapadmin.conf

Alias /phpldapadmin /usr/share/phpldapadmin/htdocs
Alias /ldapadmin /usr/share/phpldapadmin/htdocs
<Directory /usr/share/phpldapadmin/htdocs>
  <IfModule mod_authz_core.c>
    # Apache 2.4
    Require local
    # line 12: add access permission ip range
    Require ip 10.0.0.0/24

$ systemctl restart httpd
```

安装成功的话，在浏览器中访问 `http://localhost:8000/phpldapadmin/` 便会进入 phpLDAPadmin 管理页面：

![phpLDAPadmin 安装成功后的登录界面]({{site.img_url}}/2018-phpldapadmin.png){:.center}

按上面的方式进行登录后，就可以查看、新建、编辑和删除 `dc=xinhua,dc=io` 域下的所有条目了。


## 四、使用 Docker 安装 OpenLDAP 和 phpLDAPadmin

随着容器化技术和 Docker 的快速发展，打包和部署应用程序变得更加简单和灵活。OpenLDAP 和 phpLDAPadmin 也有自己的 Docker 镜像，使用下面的命令，可以快速的安装 OpenLDAP 和 phpLDAPadmin 环境：

```terminal
$ docker run --name ldap_core -p 389:389 -p 636:636 --env LDAP_ORGANISATION="XINHUA.IO" --env LDAP_DOMAIN="xinhua.io" --env LDAP_ADMIN_PASSWORD="Passw0rd" --detach osixia/openldap

$ docker run --name ldap_web -p 80:80 -p 443:443 --link ldap_core:ldap_core --env PHPLDAPADMIN_LDAP_HOSTS=ldap_core --detach osixia/phpldapadmin
```


## 五、参考资料

* [Configure LDAP Server in CentOS 7](https://www.server-world.info/en/note?os=CentOS_7&p=openldap&f=1)
* [Install phpLDAPadmin to operate LDAP Server in CentOS 7](https://www.server-world.info/en/note?os=CentOS_7&p=openldap&f=7)


[^1]: 每一个 LDAP 条目的区别名 dn 都是由两个部分组成的：相对区别名 rdn 以及该条目在 LDAP 目录中的位置。
[^2]: 关于如何安装这两个服务，请参考 [Install and start Apache httpd](https://www.server-world.info/en/note?os=CentOS_7&p=httpd&f=1) 和 [Install PHP](https://www.server-world.info/en/note?os=CentOS_7&p=httpd&f=3)。
