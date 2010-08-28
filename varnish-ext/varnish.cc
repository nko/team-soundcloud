#include <v8.h>
#include <node.h>

extern "C" {
  #include <errno.h>
  #include <stdio.h>
  #include <string.h>
  #include <unistd.h>
  #include <assert.h>

  #include <varnishapi.h>
}

using namespace node;
using namespace v8;

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
  FILE *fo = (FILE *) priv;
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
    return (1);

  VSL_NonBlocking(vd, 1);

  for (;;) {
    log_loop(vd);
    //fprintf(stderr, "sleeping\n");
    sleep(1);
  }
  //do_once(vd);

  return(0);
}

class Varnish: ObjectWrap
{
  public:
  struct VSL_data *vd;
  struct varnish_stats *vsl_stats;

  static Persistent<FunctionTemplate> s_ct;
  static void Init(Handle<Object> target)
  {
    HandleScope scope;

    Local<FunctionTemplate> t = FunctionTemplate::New(New);

    s_ct = Persistent<FunctionTemplate>::New(t);
    s_ct->InstanceTemplate()->SetInternalFieldCount(1);
    s_ct->SetClassName(String::NewSymbol("Varnish"));

    NODE_SET_PROTOTYPE_METHOD(s_ct, "stats", Stats);

    target->Set(String::NewSymbol("Varnish"), s_ct->GetFunction());
  }

  static const char* ToCString(const v8::String::Utf8Value& value) {
    return *value ? *value : "<string conversion failed>";
  }

  static Handle<Value> New(const Arguments& args)
  {
    HandleScope scope;
    const char *name = NULL;

    if (args.Length() == 1) {
        String::Utf8Value *str = new String::Utf8Value(args[0]);
        name = ToCString(*str);
    }

    Varnish* v = new Varnish(name);
    v->Wrap(args.This());
    return args.This();
  }

  static Handle<Value> Stats(const Arguments& args)
  {
    HandleScope scope;
    Varnish* v = ObjectWrap::Unwrap<Varnish>(args.This());
    Local<Object> obj = Object::New();
    #define MAC_STAT(n, t, l, f, e) obj->Set(String::New(#n), Integer::New(v->vsl_stats->n));
    #include <stat_field.h>
    #undef MAC_STAT

    return scope.Close(obj);
  }

  Varnish(const char *n_arg)
  {
    vd = VSL_New();
    if (VSL_OpenLog(vd, n_arg)) {
      ThrowException(String::New("Error opening logs"));
      //throw "Error opening logs"
    }

    if ((vsl_stats = VSL_OpenStats(n_arg)) == NULL) {
      ThrowException(String::New("Error opening stats"));
      //throw "Error opening stats";
    }
    VSL_NonBlocking(vd, 1);
  }

  ~Varnish()
  {
  }
};

Persistent<FunctionTemplate> Varnish::s_ct;

extern "C" {
  static void init (Handle<Object> target)
  {
    Varnish::Init(target);
  }

  NODE_MODULE(varnish, init);
}
