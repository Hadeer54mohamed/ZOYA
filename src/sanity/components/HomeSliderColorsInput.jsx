"use client";

import { useFormValue } from "sanity";

/**
 * Checkbox-style list for `array` of strings: `options.list` must be a
 * static array, so we inject options from `colors[].name` at render time.
 */
export function HomeSliderColorsInput(props) {
  const colors = useFormValue(["colors"]);
  const list =
    Array.isArray(colors) && colors.length > 0
      ? colors
          .filter((c) => c?.name)
          .map((c) => ({ title: c.name, value: c.name }))
      : [];

  return props.renderDefault({
    ...props,
    schemaType: {
      ...props.schemaType,
      options: {
        ...props.schemaType.options,
        list,
      },
    },
  });
}
