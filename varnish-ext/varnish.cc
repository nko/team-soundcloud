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
    NODE_SET_PROTOTYPE_METHOD(s_ct, "loop", Loop);

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

  static Handle<Value> Loop(const Arguments& args)
  {
    HandleScope scope;
    Varnish* v = ObjectWrap::Unwrap<Varnish>(args.This());

    if (args.Length() == 1 && args[0]->IsFunction()) {
      Local<Function> callback = Local<Function>::Cast(args[0]);
      v->vsl_dispatch(&callback);
    }

    return v8::Undefined();
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

  static int
  handler(void *priv, enum shmlogtag tag, unsigned fd, unsigned len,
      unsigned spec, const char *ptr)
  {
    Local<Function> *cb = (Local<Function> *) priv;
    char type;

    assert(cb != NULL);

    type = (spec & VSL_S_CLIENT) ? 'c' :
        (spec & VSL_S_BACKEND) ? 'b' : '-';

    Local<Value> argv[2];
    argv[0] = Local<Value>::New(String::New(VSL_tags[tag]));
    argv[1] = Local<Value>::New(String::New(ptr));

    (*cb)->Call(Context::GetCurrent()->Global(), 2, argv);

    //fprintf(stderr, "%5d %-12s %c %.*s\n", fd, VSL_tags[tag], type, len, ptr);
    return (0);
  }

  void
  vsl_dispatch(Local<Function> *callback)
  {
    while (VSL_Dispatch(vd, handler, callback) >= 0) {
      if (fflush(stdout) != 0) {
        perror("stdout");
        break;
      }
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
