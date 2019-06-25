var vs = `#version 300 es
#define POSITION_LOCATION 0
#define NORMAL_LOCATION 1
#define UV_LOCATION 2
layout(location = POSITION_LOCATION) in vec3 in_pos;
layout(location = NORMAL_LOCATION) in vec3 in_norm;
layout(location = UV_LOCATION) in vec2 in_uv;

out vec2 fs_uv;
out vec3 fs_norm;
out vec3 fs_pos;

uniform mat4 matrix;
uniform mat4 nMatrix;     //matrix do transform normals
uniform mat4 pMatrix;     //matrix do transform positions

void main() {
  fs_norm = mat3(nMatrix) * in_norm;
  fs_pos = (pMatrix * vec4(in_pos, 1.0)).xyz;
  fs_uv = vec2(in_uv.x, 1.0-in_uv.y);
  gl_Position = matrix * vec4(in_pos,1.0);
}`;

// Fragment shader
var fs = `#version 300 es
precision mediump float;
in vec3 fs_norm;
in vec3 fs_pos;
in vec2 fs_uv;
uniform sampler2D u_texture;


uniform vec3 mDiffColor; //material diffuse color
uniform vec3 mSpecColor; //material specular color
uniform float mSpecPower; //power of specular ref
uniform vec3 lightDir; // directional light direction vec
uniform vec3 lightColor; //directional light color
uniform float ambPower;
uniform float texturePower;
uniform vec4 materialColor;


out vec4 outColor;
void main() {

  vec3 nLightDirection = - normalize(lightDir);
  vec3 nNormal = normalize(fs_norm);
	vec4 textureCol = texturePower*texture(u_texture, fs_uv)+ (1.0-texturePower)*materialColor;
  vec3 diffuse = textureCol.xyz * mDiffColor * clamp(dot(nLightDirection,nNormal), 0.0, 1.0);

  vec3 r = 2.0f * dot(nLightDirection,nNormal) * nNormal - nLightDirection;

  vec3 phongSpecular = mSpecColor * lightColor * pow(clamp(dot(nNormal,r), 0.0, 1.0), mSpecPower);


  outColor = vec4(min(diffuse + phongSpecular + ambPower*textureCol.xyz, vec3(1.0, 1.0, 1.0)),1.0);
}`;
