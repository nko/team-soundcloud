/*-
 * Copyright (c) 2006 Verdens Gang AS
 * Copyright (c) 2006-2009 Linpro AS
 * All rights reserved.
 *
 * Author: Poul-Henning Kamp <phk@phk.freebsd.dk>
 * Author: Dag-Erling Smørgrav <des@des.no>
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE AUTHOR AND CONTRIBUTORS ``AS IS'' AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED.  IN NO EVENT SHALL AUTHOR OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS
 * OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
 * HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
 * LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY
 * OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF
 * SUCH DAMAGE.
 *
 * Log tailer for Varnish
 */

#include <ctype.h>
#include <errno.h>
#include <signal.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <limits.h>
#include <assert.h>

#include <varnishapi.h>

#if 0
#define AC(x) assert((x) != ERR)
#else
#define AC(x) x
#endif

static void
dump(const unsigned char *p)
{
  const unsigned char *q;
  q = p + SHMLOG_DATA;
  fprintf(stderr, "%s\n", q);
}

int
handler(void *priv, enum shmlogtag tag, unsigned fd, unsigned len,
    unsigned spec, const char *ptr)
{
  FILE *fo = priv;
  int type;

  assert(fo != NULL);

  type = (spec & VSL_S_CLIENT) ? 'c' :
      (spec & VSL_S_BACKEND) ? 'b' : '-';

  fprintf(fo, "%5d %-12s %c %.*s\n", fd, VSL_tags[tag], type, len, ptr);
  return (0);
}

static void
do_once(struct VSL_data *vd)
{
  unsigned char *p;
  while (VSL_NextLog(vd, &p) > 0)
    dump(p);
}

static void 
log_loop(struct VSL_data *vd)
{
  while (VSL_Dispatch(vd, handler, stdout) >= 0) {
    if (fflush(stdout) != 0) {
      perror("stdout");
      break;
    }
  }
}

int
main(int argc, char **argv)
{
  struct VSL_data *vd;
  const char *n_arg = NULL;
  int o = 0;

  vd = VSL_New();

  while ((o = getopt(argc, argv, VSL_ARGS "1fn:V")) != -1) {
    switch (o) {
    case 'n':
      n_arg = optarg;
      break;
    default:
      if (VSL_Arg(vd, o, optarg) > 0)
        break;
    }
  }

  if (VSL_OpenLog(vd, n_arg))
    exit (1);

  VSL_NonBlocking(vd, 1);

  for (;;) {
    log_loop(vd);
    //fprintf(stderr, "sleeping\n");
    sleep(0.5);
  }
  //do_once(vd);

  exit(0);
}
