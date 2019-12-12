---
layout: post
title: 'OpenLDAP 的备份与恢复'
tags: [code]
---


本文将主要介绍如何备份 OpenLDAP 的配置目录和数据目录，并将其恢复到另一个 OpenLDAP 服务中。如果你还不熟悉什么是 OpenLDAP，请查看 [CentOS 7 环境下 OpenLDAP 的安装与配置]({{site.baseurl}}{% link _posts/2018-01-02-openldap-in-centos-7.md %})。

## 一、OpenLDAP 的备份

OpenLDAP 的备份可以通过服务端的 `slapcat` 命令或客户端的 `ldapsearch` 命令两种方式进行。下面展示了如何在 OpenLDAP 服务端使用 `slapcat` 对配置目录和数据目录进行导出。

```terminal
$ slapcat -n 0 -l ./config.`date '+%Y-%m-%d'`.ldif
$ slapcat -n 2 -l ./data.`date '+%Y-%m-%d'`.ldif
```

其中，`-n` 表示要导出的 OpenLDAP 数据库编号。


## 二、OpenLDAP 的恢复

在开始恢复之前，需要先暂停 OpenLDAP 服务。

```terminal
$ systemctl stop slapd
```

OpenLDAP 配置目录一般位于 `/etc/openldap/slapd.d`，我们需要先将原有配置删除，然后使用 `slapadd` 导入新的配置：

```terminal
$ rm -rf /etc/openldap/slapd.d/*
$ slapadd -n 0 -F /etc/openldap/slapd.d -l ./config.2019-01-04.ldif
$ chown -R ldap:ldap /etc/openldap/slapd.d
```

OpenLDAP 数据目录一般位于 `/var/lib/ldap`，同样的我们需要先将原有数据删除，然后使用 `slapadd` 导入新的数据：

```terminal
$ rm -rf /var/lib/ldap/*
$ slapadd -n 2 -F /etc/openldap/slapd.d -l ./data.2019-01-04.ldif
$ chown -R ldap:ldap /var/lib/ldap
```

最后，重启 OpenLDAP 服务即可。

```terminal
$ systemctl start slapd
```
