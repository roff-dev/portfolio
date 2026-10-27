---
title: "Endless rooms with no per-frame work"
project: every-page
language: glsl
skill: "GPU performance"
file: "src/scene/shaders/library.vert"
order: 3
---

```glsl
uniform vec2 uRoomOffset; // whole rooms between world origin and the library's real coordinates

void main() {
  mat4 m = modelMatrix * instanceMatrix;
  vec3 pos = position;
  #ifdef BOOKS
    // Every book's height and colour come from which room and slot it is in, so moving
    // the whole set of rooms by a whole room re-dresses it for free.
    vec3 origin = (m * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
    vec2 room = roomOf(origin) + uRoomOffset;
    float slot = float(gl_InstanceID - (gl_InstanceID / 640) * 640);
    float height = 0.40 + 0.14 * hash13(vec3(room, slot));
    pos.y = (pos.y + 0.5) * height;
    pos.z *= 0.88 + 0.12 * hash13(vec3(room.yx, slot + 7.0));
    vColor = spineColour(hash13(vec3(room + 0.37, slot * 1.3)));
    // …the searched-for book stands proud in its own colour
  #endif
  vec4 w = m * vec4(pos, 1.0);
  gl_Position = projectionMatrix * viewMatrix * w;
}
```

**The problem:** The library never ends, so as you walk, rooms have to be recycled ahead of you, and every one holds 640 books that each need a different height and colour.

**Why this approach:** Rewriting 5,760 instance matrices and colours every time you crossed into a new room cost 10.6 ms on a throttled phone CPU, most of a frame. Working the look out in the vertex shader from the room's coordinates means moving the whole block by one room in JavaScript is a single position change, and the books re-dress themselves.

**What to notice:** `uRoomOffset`. The camera is periodically pulled back to the origin so floats stay precise, and this offset keeps the books' "real" coordinates, so the same shelf always looks the same.
