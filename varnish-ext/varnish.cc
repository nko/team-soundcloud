#include <v8.h>
#include <node.h>
#include <node_events.h>

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

class Varnish: EventEmitter
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
    s_ct->Inherit(EventEmitter::constructor_template);
    s_ct->InstanceTemplate()->SetInternalFieldCount(1);
    s_ct->SetClassName(String::NewSymbol("Varnish"));

    NODE_SET_PROTOTYPE_METHOD(s_ct, "stats", Stats);
    NODE_SET_PROTOTYPE_METHOD(s_ct, "listen", Listen);
    NODE_SET_PROTOTYPE_METHOD(s_ct, "config", Config);

    target->Set(String::NewSymbol("Varnish"), s_ct->GetFunction());
  }

  static const char* ToCString(const v8::String::Utf8Value& value) {
    if (*value) {
      return *value;
    } else {
      throw "String conversion failed";
    }
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

  static Handle<Value> Listen(const Arguments& args)
  {
    Varnish* v = ObjectWrap::Unwrap<Varnish>(args.This());

    if (args.Length() == 1 && args[0]->IsFunction()) {
      Local<Function> callback = Local<Function>::Cast(args[0]);
      v->vsl_dispatch(&callback);
    } else {
      v->vsl_dispatch(NULL);
    }

    return Undefined();
  }

  static Handle<Value> Config(const Arguments& args)
  {
    Varnish* v = ObjectWrap::Unwrap<Varnish>(args.This());
    if (args.Length() == 2) {
        const char *arg, *opt;
        String::Utf8Value a0(args[0]);
        String::Utf8Value a1(args[1]);

        arg = ToCString(a0);
        opt = ToCString(a1);

        v->vsl_arg(*arg, opt);
    } else {
      return ThrowException(String::New("Invalid args"));
    }

    return Undefined();
  }

  Varnish(const char *n_arg)
  {
    vd = VSL_New();
    if (VSL_OpenLog(vd, n_arg)) {
      ThrowException(String::New("Error opening logs"));
    }

    if ((vsl_stats = VSL_OpenStats(n_arg)) == NULL) {
      ThrowException(String::New("Error opening stats"));
    }
    VSL_NonBlocking(vd, 1);
  }

  ~Varnish()
  {
  }

  static int
  handler(void *priv, enum shmlogtag tag, unsigned fd, unsigned len,
      unsigned spec, const char *ptr)
  {
    Varnish *v = (Varnish *) priv;

    assert(v != NULL);

    Local<Value> argv[4];
    argv[0] = Local<Value>::New(String::New(VSL_tags[tag]));
    argv[2] = Local<Value>::New(Integer::New(fd));
    argv[1] = Local<Value>::New(Integer::New(spec));
    argv[3] = Local<Value>::New(String::New(ptr));

    v->Emit(String::New("log"), 4, argv);

    switch (tag) {
      #define SLTM(name) case SLT_##name: v->Emit(String::New(#name), 4, argv); break;
      #include <shmlog_tags.h>
      #undef SLTM
      default:
        ;
    }
    //fprintf(stderr, "%5d %-12s %c %.*s\n", fd, VSL_tags[tag], type, len, ptr);
    return (0);
  }

  void
  vsl_dispatch(Local<Function> *callback)
  {
    while (VSL_Dispatch(vd, handler, this) >= 0)
      ;
  }

  void
  vsl_arg(char arg, const char *opt)
  {
    if (VSL_Arg(vd, arg, opt) != 1) {
      ThrowException(String::New("Error setting args"));
    }
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
