int i;

for (i = 0; i < length; i += 2) {
  vec4 data = texture2D (cogl_sampler0, vec2(i * (1.0 / length) + 0.01, 0));
  vec4 color = texture2D (cogl_sampler0, vec2((i + 1) * (1.0 / length) + 0.01, 0));
  float x = data.r;
  float y = data.g;
  float r = data.b;

  float x2 = cogl_tex_coord0_in.x - x;
  float y2 = cogl_tex_coord0_in.y - y;
  float d = sqrt(x2 * x2  + y2 * y2);

  if (d < r)
    cogl_layer = color * (1.0 - d / r);
}
