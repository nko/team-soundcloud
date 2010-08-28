hello world!


# how to build varnish-2.1.3

CFLAGS="-pthreads" LDFLAGS="-pthreads" VCC_CC="gcc -fpic -shared -o %o %s" PCRE_LIBS=`/opt/local/bin/pcre-config --libs` PCRE_CFLAGS=`/opt/local/bin/pcre-config --cflags` ./configure --prefix=/home/node/varnish-2.1.3 ; make ; make install
