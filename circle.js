const Lang = imports.lang;
const Clutter = imports.gi.Clutter;
const Cogl = imports.gi.Cogl;
const Gio = imports.gi.Gio;
const GObject = imports.gi.GObject;


let loadTextFileContent = function(path) {
    let file = Gio.File.new_for_path(path);
    let [, content] = file.load_contents(null);
    return '' + content;
};

let createDataBuffer = function() {
    return Gio.DataOutputStream.new(Gio.MemoryOutputStream.new_resizable());
};

let circle = function(buf, x, y, r) {
    buf.put_byte(x * 255, null);
    buf.put_byte(y * 255, null);
    buf.put_byte(r * 255, null);
    buf.put_byte(0, null);
};

let color = function(buf, r, g, b, a) {
    buf.put_byte(r, null);
    buf.put_byte(g, null);
    buf.put_byte(b, null);
    buf.put_byte(a, null);
};

/**/

Clutter.init(null, null);

let coglCtx = Clutter.get_default_backend().get_cogl_context();

let dataBufToCoglTexture = function(dataBuf) {
    dataBuf.close(null);
    let data = dataBuf.base_stream.steal_as_bytes();
    let size = data.get_size() / 4;
    let tex = Cogl.Texture2D.new_with_size(coglCtx, size, 1);
    tex.set_premultiplied(false);
    tex.set_data_bytes(Cogl.PixelFormat.RGBA_8888, size, data, 0);
    log('texture size : ' + tex.get_width() + 'x' + tex.get_height());
    return tex;
};

let createPipeline = function(dataBuf) {
    let pipeline = new Cogl.Pipeline(coglCtx);
    let snippet = new Cogl.Snippet(Cogl.SnippetHook.LAYER_FRAGMENT,
                                   "uniform float dst_width;\n" +
                                   "uniform float dst_height;\n" +
                                   "uniform int length;\n",
                                   loadTextFileContent('./circle.fs'));
    pipeline.set_color4f(0.0, 0.0, 0.0, 0.0);
    pipeline.set_layer_filters(0,
                               Cogl.PipelineFilter.NEAREST,
                               Cogl.PipelineFilter.NEAREST);
    pipeline.set_layer_texture(0, dataBufToCoglTexture(dataBuf));
    pipeline.add_layer_snippet(0, snippet);
    return pipeline;
};

let setPipelineUniformFloat = function(pipeline, name, value) {
    let loc = pipeline.get_uniform_location(name);
    pipeline.set_uniform_1f(loc, value);
};

let setPipelineUniformInt = function(pipeline, name, value) {
    log('length: ' + value);
    let loc = pipeline.get_uniform_location(name);
    pipeline.set_uniform_1i(loc, value);
};

let MyContent = new Lang.Class({
    Name: 'MyContent',
    Extends: GObject.Object,
    Implements: [Clutter.Content],

    _init: function(params) {
        this.parent(params);

        let dataBuf = createDataBuffer();
        circle(dataBuf, 0.25, 0.5, 0.25);
        color(dataBuf, 255, 0, 0, 255);
        circle(dataBuf, 0.90, 0.90, 0.1);
        color(dataBuf, 0, 0, 255, 255);
        circle(dataBuf, 0.90, 0.10, 0.1);
        color(dataBuf, 0, 255, 0, 255);
        circle(dataBuf, 0.5, 0.5, 0.1);
        color(dataBuf, 255, 255, 0, 255);


        let length = dataBuf.base_stream.get_data_size() / 8;
        this._pipeline = createPipeline(dataBuf);
        setPipelineUniformInt(this._pipeline, 'length', length * 2);
    },

    vfunc_get_preferred_size: function() {
        return [true, 1, 1];
    },
    vfunc_paint_content: function(actor, node) {
        let box = actor.get_content_box();
        //setPipelineUniformFloat(this._pipeline, 'dst_width', box.get_width());
        //setPipelineUniformFloat(this._pipeline, 'dst_height', box.get_height());
        let n = new Clutter.PipelineNode(this._pipeline);
        n.set_name('MyContent');
        n.add_rectangle(box);
        node.add_child(n);
    },
});

let stage = new Clutter.Stage({
    width: 800,
    height: 600,
    content: new MyContent(),
    user_resizable: true,
});
stage.connect('destroy',
              Lang.bind(this, function() { Clutter.main_quit(); }));


stage.show();
Clutter.main();
