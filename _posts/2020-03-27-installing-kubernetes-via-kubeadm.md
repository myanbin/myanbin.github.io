---
layout: post
title: '使用 kubeadm 安装 Kubernetes 集群'
tags: [code]
---

Kubernetes，简称 k8s，是 Google 开源的一个容器编排引擎，其的目标是让部署容器化的应用简单并且高效，它支持自动化部署、大规模可伸缩、应用容器化管理。随着云原生技术的发展，Kubernetes 受到越来越多的关注。

本文将主要介绍如何使用 kubeadm 安装部署 Kubernetes 集群（注：安装版本为 1.17.3）。通过学习，你将学会如何从零开始搭建一个 Kubernetes 集群。

## 准备虚拟机环境

创建 5 台 CentOS 虚拟主机，并在本地电脑上配置 SSH 免密登录（注：下面所有操作默认在 root 下执行）：

```yaml
# 配置 SSH 免密登录
# ~/.ssh/conf

# k8sadm01
Host ka01
    HostName 192.168.220.31
    Port 22
    User root
    IdentityFile ~/.ssh/id_rsa

# k8sadm02
Host ka02
    HostName 192.168.220.32
    Port 22
    User root
    IdentityFile ~/.ssh/id_rsa

# k8sadm03
Host ka03
    HostName 192.168.220.33
    Port 22
    User root
    IdentityFile ~/.ssh/id_rsa

# k8sadm04
Host ka04
    HostName 192.168.220.34
    Port 22
    User root
    IdentityFile ~/.ssh/id_rsa

# k8sadm05
Host ka05
    HostName 192.168.220.35
    Port 22
    User root
    IdentityFile ~/.ssh/id_rsa
```

这 5 台主机中，k8sadm01～k8sadm05 将作为 Master 节点，k8sadm01～k8sadm05 将作为 Worker 节点。


使用下面命令配置 5 台主机的 hostname 分别为 k8sadm01～k8sadm05：

```bash
$ hostnamectl set-hostname k8sadm01
```

并在每台主机中追加如下的 Host 配置信息：

```sh
$ vim /etc/hosts
...
192.168.220.31  k8sadm01
192.168.220.32  k8sadm02
192.168.220.33  k8sadm03
192.168.220.34  k8sadm04
192.168.220.35  k8sadm05
```

关闭系统防火墙及 SELinux：

```bash
$ systemctl stop firewalld
$ systemctl disable firewalld

$ setenforce 0
$ sed -i 's/^SELINUX=enforcing$/SELINUX=permissive/' /etc/selinux/config
```

修改系统时区：

```bash
$ timedatectl set-timezone Asia/Shanghai
```

配置 sysctl.d（注：避免流量无法正确路由的问题），并禁用交换分区（注：提高节点稳定性）：

```bash
$ cat << EOF > /etc/sysctl.d/99-k8s.conf
# Enable netfilter on bridges.
net.bridge.bridge-nf-call-iptables  = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.ipv4.ip_forward                 = 1
# Disable devices and files for paging and swapping.
vm.swappiness = 0
EOF
$ sysctl --system
$ swapoff -a
```

因为 kube-proxy 使用 ipvs 模式，因此还需要配置 ipvs（注：传输层负载均衡）：

```bash
$ yum install -y ipvsadm ipset
$ cat << EOF > /etc/sysconfig/modules/ipvs.modules
#!/bin/sh
ipvs_modules="ip_vs ip_vs_lc ip_vs_wlc ip_vs_rr ip_vs_wrr ip_vs_lblc ip_vs_lblcr ip_vs_dh ip_vs_sh ip_vs_fo ip_vs_nq ip_vs_sed ip_vs_ftp ip_vs_ovf ip_vs_pe_sip nf_conntrack_ipv4"
for kernel_module in ${ipvs_modules}; do
    /sbin/modinfo -F filename ${kernel_module} > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        /sbin/modprobe ${kernel_module}
    fi
done
EOF
$ chmod +x /etc/sysconfig/modules/ipvs.modules && sh /etc/sysconfig/modules/ipvs.modules
```

升级主机内核为 4.4.178：

```bash
$ yum install -y ./kernel-lt-4.4.178-1.el7.elrepo.x86_64.rpm
$ grub2-set-default 0 && grub2-mkconfig -o /boot/grub2/grub.cfg
$ yun remove -y kernel-tools kernel-tools-libs
$ yum install -y ./kernel-lt-tools-4.4.178-1.el7.elrepo.x86_64.rpm ./kernel-lt-tools-libs-4.4.178-1.el7.elrepo.x86_64.rpm
```



## 安装 HAProxy 和 Keepalived 基础组件

在 k8s 集群的 master 节点上，需要安装 HAProxy 和 Keepalived 组件。

HAProxy 是一个提供高可用性、负载均衡以及基于 TCP 和 HTTP 应用的代理服务器，可以保护你的 Web 服务器或数据库不被暴露到网络上。

Keepalived 是一个基于虚拟路由冗余协议（缩写：VRRP）来实现的 Web 服务高可用方案，可以利用其来避免单点故障。一个 Web 服务至少会有 2 台服务器运行 Keepalived，一台为主服务器 MASTER，一台为备份服务器 BACKUP，但是对外表现为一个虚拟 IP，主服务器会发送特定的消息给备份服务器，当备份服务器收不到这个消息的时候，即主服务器宕机的时候，备份服务器就会接管虚拟 IP，继续提供服务，从而保证了高可用性。

在 k8sadm01～k8sadm03 这三台主机上安装 HAProxy 并配置：

```bash
$ yum install -y haproxy
$ cat << EOF >> /etc/haproxy/haproxy.cfg
# Kubernetes proxy rule
listen k8sadm
    bind 0.0.0.0:8443
    mode tcp
    option tcplog
    balance roundrobin
    server k8sadm01 192.168.220.31:6443 maxconn 1000 check inter 2000 fall 3 rise 2 weight 1
    server k8sadm02 192.168.220.32:6443 maxconn 1000 check inter 2000 fall 3 rise 2 weight 1
    server k8sadm03 192.168.220.33:6443 maxconn 1000 check inter 2000 fall 3 rise 2 weight 1
EOF
```

根据 haproxy.cfg 中的日志配置项，同时修改系统日志 `/etc/rsyslog.conf` 配置：

```bash
$ sed -i 's/^#[$]ModLoad imudp$/$ModLoad imudp/' /etc/rsyslog.conf
$ sed -i 's/^#[$]UDPServerRun 514$/$UDPServerRun 514/' /etc/rsyslog.conf
$ cat << EOF >> /etc/rsyslog.conf
# Save haproxy to /var/log/haproxy.log
local2.*                                                /var/log/haproxy.log
EOF
$ systemctl start haproxy
$ systemctl enable haproxy
```

安装 Kepalived 并配置：

```bash
$ yum install -y keepalived
```

配置文件 `/etc/keepalived/keepalived.conf`，修改内容如下：

```conf
# /etc/keepalived/keepalived.conf

global_defs {
   notification_email {
     acassen@firewall.loc
     failover@firewall.loc
     sysadmin@firewall.loc
   }
   notification_email_from Alexandre.Cassen@firewall.loc
   smtp_server 192.168.200.1
   smtp_connect_timeout 30
   # 这里分别填入对应主机名
   router_id k8sadm01
   vrrp_skip_check_adv_addr
   # 这个参数会导致 Virtual IP 无法 PING 通
   # vrrp_strict
   vrrp_garp_interval 0
   vrrp_gna_interval 0
}

vrrp_instance VI_1 {
    # k8sadm01 为 MASTER 节点，k8sadm02/03 为 BACKUP 节点
    state MASTER
    interface eth0
    virtual_router_id 51
    # MASTER 节点优先级为 100，BACKUP 节点优先级为 50
    priority 100
    advert_int 1
    authentication {
        auth_type PASS
        auth_pass Passw0rd
    }
    virtual_ipaddress {
        192.168.220.31
        192.168.200.32
        192.168.200.33
    }
}
```

启动服务：

```bash
$ systemctl start keepalived
$ systemctl enable keepalived
```




## 安装 Docker

配置阿里的 yum 源，并安装 Docker（注：当前最新版本为 19.03.6）：

```bash
$ yum install -y yum-utils device-mapper-persistent-data lvm2
$ yum-config-manager --add-repo http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
$ yum install -y docker-ce docker-ce-cli
```

创建 Docker 守护进程的配置文件，包括阿里镜像仓库，并重启 Docker：

```bash
$ mkdir /etc/docker
$ cat << EOF > /etc/docker/daemon.json
{
  "exec-opts": ["native.cgroupdriver=systemd"],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "100m"
  },
  "registry-mirrors": ["https://umqjaxg5.mirror.aliyuncs.com"],
  "storage-driver": "overlay2",
  "storage-opts": [
    "overlay2.override_kernel_check=true"
  ]
}
EOF
$ systemctl daemon-reload
$ systemctl start docker
```

根据 k8s 的最佳实践，使用 systemd 作为 cgroup 驱动，可以更好地保证集群运行稳定。


## 安装 kubelet、kubeadm 和 kubectl

配置阿里的 yum 源，并安装：

```bash
$ cat << EOF > /etc/yum.repos.d/kubernetes.repo
[kubernetes]
name=Kubernetes
baseurl=https://mirrors.aliyun.com/kubernetes/yum/repos/kubernetes-el7-x86_64/
enabled=1
gpgcheck=1
repo_gpgcheck=1
gpgkey=https://mirrors.aliyun.com/kubernetes/yum/doc/yum-key.gpg https://mirrors.aliyun.com/kubernetes/yum/doc/rpm-package-key.gpg
EOF
$ yum install -y kubelet kubeadm kubectl --disableexcludes=kubernetes
$ systemctl enable --now kubelet
$ systemctl start kubelet
```

注：当前最新版本为 1.17.3-0

注：可使用下面命令查看 kubelet 服务的日志：

```bash
$ journalctl -xefu kubelet
```

注：如果此时执行 `service status kubelet` 命令，将得到 kubelet 启动失败的错误提示，请忽略此错误，因为必须完成后续步骤中 `kubeadm init` 的操作，kubelet 才能正常启动


## 初始化 Master 节点

使用下面的命令获取 kubeadm 默认配置：

```bash
$ kubeadm config print init-defaults > ./kubeadm.config.yaml
```

下面是 `kubeadm.config.yaml` 配置的具体内容，需要修改的地方已在配置中进行注释说明：

```yaml
apiVersion: kubeadm.k8s.io/v1beta2
kind: InitConfiguration
bootstrapTokens:
- groups:
  - system:bootstrappers:kubeadm:default-node-token
  token: abcdef.0123456789abcdef
  ttl: 24h0m0s
  usages:
  - signing
  - authentication
localAPIEndpoint:
  # 修改此处的 API 端点信息
  advertiseAddress: 192.168.220.31
  bindPort: 6443
nodeRegistration:
  criSocket: /var/run/dockershim.sock
  name: k8sadm01
  taints:
  - effect: NoSchedule
    key: node-role.kubernetes.io/master
  # 设置 cgroup 驱动方式为 systemd
  kubeletExtraArgs:
    cgroup-driver: systemd
---
apiVersion: kubeadm.k8s.io/v1beta2
kind: ClusterConfiguration
apiServer:
  timeoutForControlPlane: 4m0s
certificatesDir: /etc/kubernetes/pki
clusterName: kubernetes
controllerManager: {}
dns:
  type: CoreDNS
etcd:
  local:
    dataDir: /var/lib/etcd
# 此处使用 Azure k8s 镜像代替 Google Container Registry
imageRepository: gcr.azk8s.cn/google_containers
kubernetesVersion: v1.17.0
networking:
  dnsDomain: cluster.local
  podSubnet: 10.80.0.0/12
  serviceSubnet: 10.96.0.0/12
scheduler: {}
---
apiVersion: kubeproxy.config.k8s.io/v1alpha1
kind: KubeProxyConfiguration
bindAddress: 0.0.0.0
clientConnection:
  acceptContentTypes: ""
  burst: 0
  contentType: ""
  kubeconfig: /var/lib/kube-proxy/kubeconfig.conf
  qps: 0
clusterCIDR: ""
configSyncPeriod: 0s
conntrack:
  maxPerCore: null
  min: null
  tcpCloseWaitTimeout: null
  tcpEstablishedTimeout: null
enableProfiling: false
healthzBindAddress: ""
hostnameOverride: ""
iptables:
  masqueradeAll: false
  masqueradeBit: null
  minSyncPeriod: 0s
  syncPeriod: 0s
ipvs:
  excludeCIDRs: null
  minSyncPeriod: 0s
  scheduler: ""
  strictARP: false
  syncPeriod: 0s
metricsBindAddress: ""
# 修改此处的 kube-proxy 代理模式为 ipvs，默认 iptables
mode: ipvs
nodePortAddresses: null
oomScoreAdj: null
portRange: ""
udpIdleTimeout: 0s
winkernel:
  enableDSR: false
  networkName: ""
  sourceVip: ""
```

接下来，我们使用 kubeadm 初始化第一个 Master 节点。

```bash
$ kubeadm init --config ./kubeadm.config.yaml --upload-certs
```

当看到下面字样时，即表示安装成功：

```bash
Your Kubernetes control-plane has initialized successfully!

To start using your cluster, you need to run the following as a regular user:

  mkdir -p $HOME/.kube
  sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
  sudo chown $(id -u):$(id -g) $HOME/.kube/config

You should now deploy a pod network to the cluster.
Run "kubectl apply -f [podnetwork].yaml" with one of the options listed at:
  https://kubernetes.io/docs/concepts/cluster-administration/addons/

Then you can join any number of worker nodes by running the following on each as root:

kubeadm join 192.168.220.31:6443 --token abcdef.0123456789abcdef \
    --discovery-token-ca-cert-hash sha256:65254433887607816949bef40124f041ca4d37307efda546336f73541738b1e3
```


## 安装 Calico 网络插件

在部署一般应用之前，应该先安装 Pod 网络插件，以便 Pod 间可以相互通信。这里我们选择 Calico，另外你也可以选择使用 Flannel。

下载 YAML 文件（版本：v3.13.0）并修改其中的子网地址配置：

```bash
$ curl -O https://docs.projectcalico.org/manifests/calico.yaml
$ vim ./calico.yaml
...
# The default IPv4 pool to create on startup if none exists. Pod IPs will be
# chosen from this range. Changing this value after installation will have
# no effect. This should fall within `--cluster-cidr`.
- name: CALICO_IPV4POOL_CIDR
  value: "10.80.0.0/12"
...
```

Calico 默认子网地址 `192.168.0.0/16` 与我们集群中 5 台主机 IP 地址范围有重合，所以需要自定义一个子网地址段（该地址段需要与 kubeadm 配置中的 podSubnet 相同）。

参考：[https://docs.projectcalico.org/getting-started/kubernetes/quickstart](https://docs.projectcalico.org/getting-started/kubernetes/quickstart)


## 安装 Worker 节点

接下来我们先将 k8sadm04 主机配置为集群的一个 Worker 节点，通过下列命令来加入集群：

```bash
$ kubeadm join 192.168.220.31:6443 --token abcdef.0123456789abcdef \
    --discovery-token-ca-cert-hash sha256:65254433887607816949bef40124f041ca4d37307efda546336f73541738b1e3
```

注：如果 Token 会在 24h 后过期，此时可以通过以下方式重新获取：

```bash
$ kubeadm token create --print-join-command
```

等待数分钟，我们便可以在 k8sadm01 主机上查看到该节点：

```bash
$ kubectl get nodes
NAME       STATUS     ROLES    AGE     VERSION
k8sadm01   Ready      master   9m38s   v1.17.3
k8sadm04   Ready      <none>   6m13s   v1.17.3
```


## 安装其他 Master 节点

下面我们来安装另外两个 Master 节点。在 k8sadm02 和 k8sadm03 上分别执行下面命令即可：

```bash
$ kubeadm join 192.168.220.31:6443 --token r4t3l3.14mmuivm7xbtaeoj \
    --discovery-token-ca-cert-hash sha256:06f49f1f29d08b797fbf04d87b9b0fd6095a4693e9b1d59c429745cfa082b31d \
    --control-plane --certificate-key 7373f829c733b46fb78f0069f90185e0f00254381641d8d5a7c5984b2cf17cd3
```

等所有的 Master 和 Worker 节点安装完成后，可以在任意节点上执行 `kubectl get nodes -o wide` 查看集群内各节点状态：

```bash
$ kubectl get nodes
NAME       STATUS     ROLES    AGE     VERSION
k8sadm01   Ready      master   9m38s   v1.17.3
k8sadm02   Ready      master   4m38s   v1.17.3
k8sadm03   Ready      master   1m38s   v1.17.3
k8sadm04   Ready      <none>   6m13s   v1.17.3
k8sadm05   Ready      <none>   1m13s   v1.17.3
```

## 安装 Kubernetes Dashboard

现在我们需要一个图形化工具来管理 k8s 集群，官方出品的 Kubernetes Dashboard 是个不错的选择。


## 安装 Ingress 控制器

Ingress 用于向外暴露 k8s 集群内的服务，我们使用目前最常见的 ingress-nginx 作为 Ingress 控制器（注：其他可选控制器包括 Traefik 等，这里不多介绍）。与使用 LoadBalance 的 Service 不同，Ingress 只需要一个公网 IP 就能为多个 Service 提供访问，当从集群外向 Ingress 发送 HTTP 请求时，Ingress 会根据请求的主机名和路径将该请求转发到对应的服务。

首先，我们下载官方的 YAML 配置文件：

```bash
$ wget https://raw.githubusercontent.com/kubernetes/ingress-nginx/nginx-0.30.0/deploy/static/mandatory.yaml
```

官方的配置文件中使用 Deployment 方式来部署 Controller，我们需要将其修改为 DaemonSet 方式进行部署。注：DaemonSet 确保全部（或者某些）节点上运行一个 Pod 的副本。当有节点加入集群时， 也会为他们新增一个 Pod 。当有节点从集群移除时，这些 Pod 也会被回收。DaemonSet 常被用在集群中每个节点的日志收集、监控、存储等场景。

```yaml
apiVersion: apps/v1
# 将 Deployment 修改为 DaemonSet
kind: DaemonSet
metadata:
  name: nginx-ingress-controller
  namespace: ingress-nginx
  labels:
    app.kubernetes.io/name: ingress-nginx
    app.kubernetes.io/part-of: ingress-nginx
spec:
  # 删除此处的 replicas: 1 配置，因为 DaemonSet 无此字段
  selector:
    matchLabels:
      app.kubernetes.io/name: ingress-nginx
      app.kubernetes.io/part-of: ingress-nginx
  template:
    metadata:
      labels:
        app.kubernetes.io/name: ingress-nginx
        app.kubernetes.io/part-of: ingress-nginx
      annotations:
        prometheus.io/port: "10254"
        prometheus.io/scrape: "true"
    spec:
      # wait up to five minutes for the drain of connections
      terminationGracePeriodSeconds: 300
      serviceAccountName: nginx-ingress-serviceaccount
      # 通过 nodeSelector 确保此 DaemonSet 运行在 edgenode=true 的节点上
      nodeSelector:
        kubernetes.io/os: linux
        edgenode: "true"
      # 使用 hostNetwork 暴露服务
      hostNetwork: true
      containers:
        - name: nginx-ingress-controller
          image: quay.io/kubernetes-ingress-controller/nginx-ingress-controller:0.30.0
          args:
            - /nginx-ingress-controller
            - --configmap=$(POD_NAMESPACE)/nginx-configuration
            - --tcp-services-configmap=$(POD_NAMESPACE)/tcp-services
            - --udp-services-configmap=$(POD_NAMESPACE)/udp-services
            - --publish-service=$(POD_NAMESPACE)/ingress-nginx
            - --annotations-prefix=nginx.ingress.kubernetes.io
          securityContext:
            allowPrivilegeEscalation: true
            capabilities:
              drop:
                - ALL
              add:
                - NET_BIND_SERVICE
            # www-data -> 101
            runAsUser: 101
          env:
            - name: POD_NAME
              valueFrom:
                fieldRef:
                  fieldPath: metadata.name
            - name: POD_NAMESPACE
              valueFrom:
                fieldRef:
                  fieldPath: metadata.namespace
          ports:
            - name: http
              containerPort: 80
              protocol: TCP
            - name: https
              containerPort: 443
              protocol: TCP
          livenessProbe:
            failureThreshold: 3
            httpGet:
              path: /healthz
              port: 10254
              scheme: HTTP
            initialDelaySeconds: 10
            periodSeconds: 10
            successThreshold: 1
            timeoutSeconds: 10
          readinessProbe:
            failureThreshold: 3
            httpGet:
              path: /healthz
              port: 10254
              scheme: HTTP
            periodSeconds: 10
            successThreshold: 1
            timeoutSeconds: 10
          lifecycle:
            preStop:
              exec:
                command:
                  - /wait-shutdown
```

参考：[https://kubernetes.github.io/ingress-nginx/deploy/baremetal/](https://kubernetes.github.io/ingress-nginx/deploy/baremetal/)

同时，我们对 k8sadm04 进行打标，将其作为集群的边缘节点。打此标的所有节点上都会安装一个 Ingress 控制器：

```bash
$ kubectl label nodes k8sadm04 edgenode=true
```

最后，创建相关资源：

```bash
$ kubectl apply -f ./mandatory.yaml
```

稍等片刻，使用下面两个命令检查资源是否就绪：

```bash
$ kubectl get daemonsets -n ingress-nginx
NAME                       DESIRED   CURRENT   READY   UP-TO-DATE   AVAILABLE   NODE SELECTOR                          AGE
nginx-ingress-controller   1         1         1       1            1           edgenode=true,kubernetes.io/os=linux   69m
$ kubectl get pods -n ingress-nginx -o wide
NAME                             READY   STATUS    RESTARTS   AGE   IP               NODE       NOMINATED NODE   READINESS GATES
nginx-ingress-controller-lwb49   1/1     Running   0          69m   192.168.220.34   k8sadm04   <none>           <none>
```

可以看到，nginx-ingress-controller 已经按预期运行在节点 k8sadm04 上，其 IP 地址为 192.168.220.34。
至此，Ingress 控制器便已安装完成。接下来我们在集群内创建一个服务，然后使用 Ingress 从外部进行访问。

下面的 YAML 配置文件声明了名为 mypage 的 Deployment 及对应 Service 资源，并通过 Ingress 进行服务暴露：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mypage
spec:
  selector:
    matchLabels:
      app: mypage
  # 告诉 Deployment 运行 2 个 Pod
  replicas: 2
  # 关于 Pod Tempalte 的定义
  template:
    metadata:
      labels:
        app: mypage
    spec:
      containers:
      - name: mypage
        image: registry.k8sadm.xinhua.tech/foo/nginx
        ports:
        - containerPort: 80

---

apiVersion: v1
kind: Service
metadata:
  name: mypage
spec:
  selector:
    app: mypage
  ports:
  - name: http
    port: 80
    protocol: TCP

---

apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  name: mypage
  annotations:
    # 指定 Ingress Controller 的类型
    kubernetes.io/ingress.class: "nginx"
    # 指定我们的 rules 的 path 可以使用正则表达式
    nginx.ingress.kubernetes.io/use-regex: "true"
spec:
  rules:
  - host: mypage.k8sadm.xinhua.tech
    http:
      paths:
      - path: /
        backend:
          serviceName: mypage
          servicePort: 80
```

执行该文件：

```bash
$ kubectl apply -f ./mypage.yaml
```

稍等片刻，我们可以通过以下命令来验证：

```bash
$ curl -v -H 'Host: mypage.k8sadm.xinhua.tech' http://192.168.220.34/
```

或者在本地 Hosts 文件中增加从 `mypage.k8sadm.xinhua.tech` 到 `192.168.220.34` 的地址解析，然后在浏览器中访问。

至此，k8s 集群即安装完毕。


## 重置集群

在 k8s 安装的过程中，可能出现或多或少的错误，需要删除集群环境，所以最后，我们用少量篇幅来介绍如何使用 kubeadm 来重置 k8s 集群。

在所有的工作节点和控制节点上执行下列命令来删除集群，此命令会还原 `kubeadm init` 或 `kubeadm join` 命令所做的修改：

```bash
$ kubeadm reset
```

根据提示，可能还需要做如下处理：

```bash
$ rm -rf /etc/cni/net.d
$ ipvsadm --clear
```

## 最后

本文中用到的配置文件，可[点击这里](https://github.com/myanbin/k8s-scripts)查看。

（完）