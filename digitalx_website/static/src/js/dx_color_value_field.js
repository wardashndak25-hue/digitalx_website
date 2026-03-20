/** @odoo-module */

import { _t } from "@web/core/l10n/translation";
import { registry } from "@web/core/registry";
import { useInputField } from "@web/views/fields/input_field_hook";
import { standardFieldProps } from "@web/views/fields/standard_field_props";

import { Component } from "@odoo/owl";

const HEX_COLOR_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const RGB_COLOR_RE = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*(0|1|0?\.\d+))?\s*\)$/i;

function expandHex(value) {
    const normalizedValue = (value || "").trim();
    if (!HEX_COLOR_RE.test(normalizedValue)) {
        return "";
    }
    if (normalizedValue.length === 4) {
        return `#${normalizedValue[1]}${normalizedValue[1]}${normalizedValue[2]}${normalizedValue[2]}${normalizedValue[3]}${normalizedValue[3]}`.toUpperCase();
    }
    return normalizedValue.toUpperCase();
}

function rgbToHex(red, green, blue) {
    return `#${[red, green, blue]
        .map((value) => Math.max(0, Math.min(255, parseInt(value, 10))).toString(16).padStart(2, "0"))
        .join("")}`.toUpperCase();
}

function isValidCssColor(value) {
    const normalizedValue = (value || "").trim();
    if (!normalizedValue) {
        return true;
    }
    if (expandHex(normalizedValue) || RGB_COLOR_RE.test(normalizedValue)) {
        return true;
    }
    const probe = document.createElement("span");
    probe.style.color = "";
    probe.style.color = normalizedValue;
    return Boolean(probe.style.color);
}

function resolveColorToHex(value) {
    const normalizedValue = (value || "").trim();
    const hexValue = expandHex(normalizedValue);
    if (hexValue) {
        return hexValue;
    }
    const rgbMatch = normalizedValue.match(RGB_COLOR_RE);
    if (rgbMatch) {
        return rgbToHex(rgbMatch[1], rgbMatch[2], rgbMatch[3]);
    }
    const probe = document.createElement("span");
    probe.style.color = "";
    probe.style.color = normalizedValue;
    if (!probe.style.color) {
        return "#FFFFFF";
    }
    document.body.appendChild(probe);
    const computedColor = window.getComputedStyle(probe).color;
    probe.remove();
    const computedMatch = computedColor.match(RGB_COLOR_RE);
    if (!computedMatch) {
        return "#FFFFFF";
    }
    return rgbToHex(computedMatch[1], computedMatch[2], computedMatch[3]);
}

export class DxColorValueField extends Component {
    static template = "digitalx_website.DxColorValueField";
    static props = {
        ...standardFieldProps,
    };

    setup() {
        useInputField({
            getValue: () => this.textValue,
            parse: (value) => this.parse(value),
        });
    }

    get textValue() {
        return this.props.record.data[this.props.name] || "";
    }

    get pickerValue() {
        return resolveColorToHex(this.textValue);
    }

    get previewValue() {
        return isValidCssColor(this.textValue) && this.textValue.trim() ? this.textValue.trim() : "transparent";
    }

    get placeholder() {
        return _t("#FFFFFF or rgba(255,255,255,0.8)");
    }

    get pickerTitle() {
        return _t("Pick a color");
    }

    parse(value) {
        const normalizedValue = (value || "").trim();
        if (!isValidCssColor(normalizedValue)) {
            throw new Error("Invalid color value");
        }
        return normalizedValue;
    }

    onColorInput(event) {
        this.props.record.update({ [this.props.name]: event.target.value.toUpperCase() });
    }
}

export const dxColorValueField = {
    component: DxColorValueField,
    displayName: _t("CSS Color"),
    supportedTypes: ["char"],
};

registry.category("fields").add("dx_color_value", dxColorValueField);
