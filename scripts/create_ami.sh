#!/bin/bash
set -euxo pipefail

# This script is used to create the custom AMI for GeoDjango (see Deploying on Beanstalk documentation )
# this is mainly there for reference and documentation as there is no garantee this will work with later version
# so don't expect it to run as is.

# packages
sudo yum-config-manager --enable epel
sudo yum -y update
sudo yum install -y make automake gcc gcc-c++ libcurl-devel  autoconf automake \
 htop  `# useful for latter debug` \
 libtiff-devel `# dep for proj` \
 gettext `#for iaso`

echo /usr/local/lib | sudo tee /etc/ld.so.conf.d/add_usr_local.conf
# ↓ this update the ld cache
sudo ldconfig

# geos
wget http://download.osgeo.org/geos/geos-3.9.4.tar.bz2
tar xjf geos-3.9.4.tar.bz2
cd geos-3.9.4
./configure
make
sudo make install
cd ..
rm -rf geos-3.9.4/

# sqlite
wget https://www.sqlite.org/2022/sqlite-autoconf-3400100.tar.gz
tar xvf sqlite-autoconf-3400100.tar.gz
cd sqlite-autoconf-3400100/
./configure
make
sudo make install
cd ..

# PROJ

## using proj-7.2.1 because it's compatible with both our legacy current and planned django version
wget https://download.osgeo.org/proj/proj-7.2.1.tar.gz
tar xvf proj-7.2.1.tar.gz
wget https://download.osgeo.org/proj/proj-data-1.9.tar.gz
cd proj-7.2.1/data/
tar xzf ../../proj-data-1.9.tar.gz
cd ~/proj-7.2.1/
#yum install libtiff-devel -y # needed by proj7 in top of sqlite3
./configure SQLITE3_CFLAGS=-I/usr/local/include/ SQLITE3_LIBS="-L/usr/local/lib/ -lsqlite3"
#./configure SQLITE3_CFLAGS=-I/home/ec2-user/sqlite-autoconf-3400100/ SQLITE3_LIBS="-L/home/ec2-user/sqlite-autoconf-3400100/ -lsqlite3"
make -j4
sudo make install
cd ..
rm -rf proj-7.2.1/

# spatialite
cd
wget https://www.gaia-gis.it/gaia-sins/libspatialite-sources/libspatialite-5.0.1.tar.gz
tar xvf libspatialite-5.0.1.tar.gz
cd libspatialite-5.0.1/
# deps (use yum search)
sudo yum install -y zlib-devel libxml2-devel
# theses deps don't seems necessary for us
./configure  --enable-freexl=no --enable-rttopo=no --enable-minizip=no
make -j4
sudo make install
cd ..
rm -rf libspatialite-5.0.1/

#
cd
wget https://download.osgeo.org/gdal/3.2.3/gdal-3.2.3.tar.gz
tar xvf gdal-3.2.3.tar.gz
cd gdal-3.2.3/
./configure  --without-python -with-sqlite3 --with-spatialite
make -j4
sudo make install
cd ..
rm -rf gdal-3.2.3/

# to check
/usr/local/bin/gdalinfo  --version


echo "Setup done!"
