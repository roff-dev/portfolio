---
title: "Moving 32,000 satellites on the graphics card"
project: overhead
language: glsl
skill: "Orbital mechanics on the GPU"
file: "src/globe/orbit.glsl.ts"
order: 1
---

```glsl
// Per object, 18 floats the GPU reads straight from one buffer:
// a e M0 ṁ | Px Py Pz ω̇ | Qx Qy Qz Ω̇ | t2 kind glint launchDay | groups epochDay

/** Where an object is, dt seconds from its anchor: Kepler's equation, then SGP4's secular drift. TEME km. */
vec3 orbitPosition(vec3 elements, float mdot, vec4 P, vec4 Q, float t2, float dt) {
  float a = elements.x;
  float e = elements.y;
  float M = mod(elements.z + mdot * dt + t2 * dt * dt, 6.2831853);
  float E = e < 0.8 ? M : PI;
  for (int i = 0; i < 5; i++) E -= (E - e * sin(E) - M) / (1.0 - e * cos(E));
  vec2 xy = vec2(a * (cos(E) - e), a * sqrt(1.0 - e * e) * sin(E));
  float dw = P.w * dt;
  float dO = Q.w * dt;
  xy = mat2(cos(dw), sin(dw), -sin(dw), cos(dw)) * xy;
  vec3 r = xy.x * P.xyz + xy.y * Q.xyz;
  r.xy = mat2(cos(dO), sin(dO), -sin(dO), cos(dO)) * r.xy;
  return r;
}

/** TEME km to scene units: (x, z, -y), one Earth radius to the unit. */
vec3 toScene(vec3 r) {
  return vec3(r.x, r.z, -r.y) / 6371.0;
}
```

**The problem:** Running the full SGP4 model for 32,000 objects every frame is far too slow for a phone, but a straight-line guess between updates is already 15 km out after 60 seconds.

**Why this approach:** Once a minute (in sim time) I fit each object's orbit as an ellipse plus SGP4's slow drift in perigee, node and drag, and let the vertex shader do the rest. The whole catalogue is one draw call. Idle frames take 0.5 ms at p99 on desktop and 2.4 ms with 50,000 objects on a 6× throttled phone, and the main thread spends 0.03 ms a frame. Against real SGP4 it's 0.5 km off (median) at 60 s and 12 km at 24 hours, where plain two-body orbits are 659 km off.

**What to notice:** Kepler's equation has no closed-form answer, so each vertex solves it with five Newton steps. Starting from π for very eccentric orbits stops those steps diverging.
