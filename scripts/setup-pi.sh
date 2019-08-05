#!/bin/bash

if [ "$(whoami)" != 'root' ] ; then
    echo "Run me as root. Something like: sudo ./setup-pi.sh"
    exit -1
fi

echo "nameserver 1.1.1.1" > /etc/resolv.conf

# set up AU locale
cp /etc/locale.gen /etc/locale.gen.backup
echo -e "en_AU.UTF-8 UTF-8\n" > /etc/locale.gen
locale-gen

# ensure SSH is is started and enabled
systemctl start ssh
systemctl enable ssh

# https://www.raspberrypi.org/documentation/configuration/wireless/access-point.md
apt-get update 
apt-get install -y dnsmasq hostapd

# stop services
systemctl stop dnsmasq
systemctl stop hostapd

# configure dhcp and dnsmasq
cat <<EOF > /etc/dhcpcd.conf
interface wlan0
    static ip_address=172.124.0.1/16
    nohook wpa_supplicant
EOF

service dhcpcd restart

mv /etc/dnsmasq.conf /etc/dnsmasq.conf.orig  

cat <<EOF > /etc/dnsmasq.conf
interface=wlan0  
dhcp-range=172.124.0.10,172.124.255.250,255.255.0.0,24h
address=/catalog.net/172.124.0.1
no-resolv
no-poll
local=/net/
EOF

# configure hostapd
cat <<EOF > /etc/hostapd/hostapd.conf
interface=wlan0
driver=nl80211
ssid=PARADISEC
hw_mode=g
channel=7
wmm_enabled=0
macaddr_acl=0
auth_algs=1
ignore_broadcast_ssid=0
country_code=AU
EOF

sed -i 's@#DAEMON_CONF=""@DAEMON_CONF="/etc/hostapd/hostapd.conf"@' /etc/default/hostapd

# start services
systemctl unmask hostapd
systemctl enable hostapd
systemctl start hostapd
systemctl start dnsmasq

# install nginx
echo "nameserver 1.1.1.1" > /etc/resolv.conf
apt-get install -y nginx

# mount the disk and configure nginx
fdisk -l | grep -q /dev/sda1
if [ "$?" != 0 ] ; then
    echo "It doesn't look like a USB is inserted in to the device."
    echo "I'm expecting to find /dev/sda1"
    echo "If a disk is plugged in, log in and see if it has a single partition on it"
    echo "Anything else, you need to figure it out. Sorry"
    exit -1
fi
mkdir -p /mnt/disk
mount | grep -q /mnt/disk
[[ $? != 0 ]] && mount /dev/sda1 /mnt/disk
[[ ! -d /mnt/disk/html ]] && mkdir -p /mnt/disk/html
if [ ! -L /var/www/html ] && [ -d /var/www/html ]; then
    mv /var/www/html /var/www/html.orig
    ln -sf /mnt/disk/html /var/www/html 
fi

grep -q /dev/sda1 /etc/fstab
if [ "$?" == 0 ] ; then
    sed -i 's/\/dev\/sda1.*//' /etc/fstab
#    echo "/dev/sda1    /mnt/disk    vfat    defaults    0    0" >> /etc/fstab
fi

cat <<EOF > /etc/rc.mount-disk
device=\$(fdisk -l | grep '\/dev' | egrep -v '(\/dev\/mmc.*|\/dev\/ram.*|^Disk)' | tail -n 1 | awk '{print \$1}')
mount \$device /mnt/disk
EOF
chmod +x /etc/rc.mount-disk

grep -q /etc/rc.mount-disk /etc/rc.local
if [ "$?" != 0 ] ; then
    echo "/etc/rc.mount-disk" >> /etc/rc.local
fi

cat <<EOF

    The final part of the setup is to set up a password for the pi user
    that is not the default password. Don't lose this or you won't be able to 
    get back in without resetting the whole device.

EOF
passwd pi


