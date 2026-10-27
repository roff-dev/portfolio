---
title: "One loop for every coloured menu link"
from: "Netmatters homepage"
language: scss
skill: "Sass loops and maps"
file: "scss/partials/utilities/_functions.scss"
order: 1
---

```scss
// One colour per section
$colors: (
  1: #526781,
  2: #4183D7,
  3: #2ECC71,
  4: #D64541,
  5: #926FB1,
  6: #F62459,
  7: #CE4125
);

@each $key, $color in $colors {
  .link-#{$key} {
    span {
      color: $color;
    }
    &:hover {
      background-color: $color;
      span {
        color: white;
      }
    }
    // the small triangle under the link
    &::after {
      border-top: 10px solid $color;
      color: $color;
    }
  }
}
```

**The problem:** The Netmatters homepage menu gives each section its own colour: the link text, its hover fill and the small triangle under it. Written by hand, that's seven near-identical blocks of CSS that all have to change together.

**Why this approach:** The colours live in one Sass map, and `@each` writes the rules for every entry in it. Adding a section, or changing a colour, is one line in the map.

**What to notice:** `#{$key}` builds the class name from the map's key, so `.link-3` always gets colour 3, and the same map drives the services boxes elsewhere on the page.
