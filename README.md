# ember-mobile-pane

Swipeable panes with tab navigation for mobile Ember apps. Panes follow the
user's finger, snap to the nearest pane with spring physics and can be
rendered lazily. `MobilePaneInfinite` builds on top of it to swipe through
an (endless) list of models, e.g. days in a calendar.

## Compatibility

- Ember.js v3.28 or above
- Embroider or ember-auto-import v2
- `@glimmer/component` v1.1.2 or v2

## Installation

```sh
pnpm add ember-mobile-pane
# or: npm install ember-mobile-pane / ember install ember-mobile-pane
```

The styles are imported automatically when you use the components.

## Usage

```gjs
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { MobilePane } from 'ember-mobile-pane';

export default class Tabs extends Component {
  @tracked activeIndex = 0;

  changePane = (index) => (this.activeIndex = index);

  <template>
    <MobilePane
      @activeIndex={{this.activeIndex}}
      @onChange={{this.changePane}}
      as |mp|
    >
      <mp.Nav />

      <mp.Scroller as |mps|>
        <mps.Pane @title="Inbox">…</mps.Pane>
        <mps.Pane @title="Archive">…</mps.Pane>
        <mps.Pane @title="Spam">…</mps.Pane>
      </mp.Scroller>

      <mp.SimpleIndicator />
    </MobilePane>
  </template>
}
```

In classic `.hbs` templates the components are available as `<MobilePane>`
and `<MobilePaneInfinite>`.

`MobilePane` is "controlled": it calls `@onChange` with the new index after a
swipe or a nav click, and you pass the new value back in as `@activeIndex`.

### `<MobilePane>`

| Argument                       | Default | Description                                                                      |
| ------------------------------ | ------- | -------------------------------------------------------------------------------- |
| `@activeIndex`                 | `0`     | Index of the active pane.                                                        |
| `@onChange(index)`             |         | Called when the active pane changes.                                             |
| `@lazyRendering`               | `true`  | Only render the content of the active pane and its direct neighbours.            |
| `@strictLazyRendering`         | `false` | Only render the content of panes that are (partially) in the viewport.           |
| `@strictLazyRenderingDeadZone` | `0`     | How far (0–1) a pane must be in the viewport before strict lazy rendering shows it. |
| `@keepRendered`                | `false` | Keep pane content rendered once it has been shown.                               |
| `@triggerVelocity`             | `0.3`   | Swipe velocity that moves to the next/previous pane regardless of the distance.  |
| `@disabled`                    | `false` | Disable swiping.                                                                 |
| `@onDragStart()`               |         | Called when a drag starts.                                                       |
| `@onDragMove(dx)`              |         | Called while dragging.                                                           |
| `@onDragEnd(index)`            |         | Called when a drag ends.                                                         |

It yields:

- `Nav`: a scrollable tab bar using each pane's `@title`. Accepts
  `@navScrollOffset` (default `75`, in px), which is how much room is left
  to the left of the active item.
- `Scroller`: the swipeable container. Yields `Pane`, which takes an
  optional `@title`. Accepts `@overScrollFactor` (default `0.34`), the
  rubber-band effect at the first and last pane (`0` disables it).
- `SimpleIndicator`: dots showing the active pane. Pass
  `@warpEnabled={{true}}` for a "warp" effect while swiping.

### `<MobilePaneInfinite>`

Renders the previous, current and next model, and calls `@onChange(model,
index)` when the user swipes to another one. Update the three models in
response. Scroll positions are remembered per model.

```gjs
<MobilePaneInfinite
  @previousModel={{this.previous}}
  @currentModel={{this.current}}
  @nextModel={{this.next}}
  @onChange={{this.showModel}}
  as |mpi|
>
  <DayView @day={{mpi.model}} @isCurrent={{mpi.isCurrentModel}} />
</MobilePaneInfinite>
```

It accepts the same rendering, gesture and drag arguments as `MobilePane`.

## Theming

All styles live in the `ember-mobile-pane` [cascade
layer](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer), so any
(unlayered) CSS in your app overrides them, whatever its specificity.

Customise the look with these custom properties, either globally or on a
single pane:

```css
:root {
  --mobile-pane-active-link-color: rebeccapurple;
}

.my-pane {
  --mobile-pane-indicator-height: 3px;
}
```

| Property                                   | Default                           |
| ------------------------------------------ | --------------------------------- |
| `--mobile-pane-link-color`                 | `#333`                            |
| `--mobile-pane-link-opacity`               | `0.6`                             |
| `--mobile-pane-active-link-color`          | `#007bff`                         |
| `--mobile-pane-active-link-opacity`        | `1`                               |
| `--mobile-pane-indicator-bg`               | `--mobile-pane-active-link-color` |
| `--mobile-pane-indicator-height`           | `2px`                             |
| `--mobile-pane-simple-indicator-bg`        | `#ccd2e3`                         |
| `--mobile-pane-simple-indicator-active-bg` | `--mobile-pane-active-link-color` |

If your app uses cascade layers itself (e.g. Tailwind CSS 4), declare the
layer order up front so ours comes first:

```css
@layer ember-mobile-pane, theme, base, components, utilities;
```

## Upgrading from 0.1.0-alpha

- Styles are plain CSS and imported automatically. Remove
  `@import "ember-mobile-pane";` from your SCSS, and `ember-cli-sass` if you
  only had it for this addon.
- The SCSS `$mobile-pane-*` variables are replaced by the
  `--mobile-pane-*` custom properties above, with the same names. The unused
  `$mobile-pane-transition-*` variables are gone.
- `@glimmer/component` is now a peer dependency, so your app must have it
  installed (it almost certainly already does).
- The addon no longer depends on `ember-concurrency`, `memory-scroll`,
  `tracked-built-ins`, `@ember/render-modifiers` or
  `ember-on-resize-modifier`. If your app used any of them through this
  addon, add them to your own `package.json`.

## Contributing

See the [Contributing](CONTRIBUTING.md) guide for details.

## License

This project is licensed under the [MIT License](LICENSE.md).
