/** @format */

import React, { useId, useState, Fragment } from "react";
import { Input } from "../../atoms/Input";
import { Switch } from "../../atoms/Switch";
import { Radio } from "../../atoms/Radio";
import { Button } from "../../atoms/Button";
import { Text } from "../../atoms/Text";
import { Divider } from "../../atoms/Divider";
import { ButtonIsland } from "../../molecules/ButtonIsland";
import { FlexContainer } from "../../layout/FlexContainer";
import type {
	SettingsSchema,
	SettingsValues,
	SettingsFieldValue,
	SettingsField,
	SettingsCategory,
} from "./types";
import styles from "./SettingsMenu.module.css";

// ============================================================================
// TYPES
// ============================================================================

interface SettingsMenuProps {
	/** The category/field structure — this is the "data" the menu drives off of. */
	schema: SettingsSchema;
	/** Current field values. Fully controlled — SettingsMenu holds no data of its own. */
	values: SettingsValues;
	onChange: (
		categoryId: string,
		fieldKey: string,
		value: SettingsFieldValue
	) => void;
	/** Controlled category selection. Omit to let SettingsMenu manage it internally. */
	selectedCategoryId?: string;
	onCategoryChange?: (categoryId: string) => void;
	/** Initial category when uncontrolled. Defaults to the first in `schema.categories`. */
	defaultCategoryId?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * SettingsMenu - data-driven settings UI: categories on the left,
 * the selected category's fields on the right. Built entirely from
 * existing atoms (Button, Input, Switch, Radio, Text, Divider,
 * FlexContainer) — no settings-specific atom exists or is needed.
 *
 * Fully controlled, same principle as ThemeManager: this component
 * renders a schema and reports changes, it never owns or persists the
 * values itself. Save/load is your job, same as theme config.
 *
 * @example
 * ```tsx
 * const schema: SettingsSchema = {
 *   categories: [
 *     {
 *       id: 'general',
 *       label: 'General',
 *       icon: <Icon><Settings /></Icon>,
 *       fields: [
 *         { key: 'displayName', type: 'text', label: 'Display name' },
 *         { key: 'autoSave', type: 'boolean', label: 'Auto-save' },
 *         {
 *           key: 'startupView',
 *           type: 'choice',
 *           label: 'Startup view',
 *           options: [
 *             { value: 'dashboard', label: 'Dashboard' },
 *             { value: 'last', label: 'Last opened' },
 *           ],
 *         },
 *       ],
 *     },
 *   ],
 * };
 *
 * const [values, setValues] = useState<SettingsValues>({
 *   general: { displayName: 'Jane', autoSave: true, startupView: 'dashboard' },
 * });
 *
 * <SettingsMenu
 *   schema={schema}
 *   values={values}
 *   onChange={(categoryId, key, value) =>
 *     setValues((prev) => ({
 *       ...prev,
 *       [categoryId]: { ...prev[categoryId], [key]: value },
 *     }))
 *   }
 * />
 * ```
 */
export function SettingsMenu({
	schema,
	values,
	onChange,
	selectedCategoryId,
	onCategoryChange,
	defaultCategoryId,
}: SettingsMenuProps) {
	const [internalSelected, setInternalSelected] = useState(
		defaultCategoryId ?? schema.categories[0]?.id
	);
	const isControlled = selectedCategoryId !== undefined;
	const activeId = isControlled ? selectedCategoryId : internalSelected;

	const handleSelect = (id: string) => {
		if (!isControlled) setInternalSelected(id);
		onCategoryChange?.(id);
	};

	const activeCategory =
		schema.categories.find((c) => c.id === activeId) ??
		schema.categories[0];

	return (
		<FlexContainer
			align="stretch"
			style={{ height: "100%", minHeight: 0 }}>
			{/* Categories — flat pill nav items, no wrapping Island. Active is
          a persistent hover-style highlight rather than a solid fill
          (see SettingsMenu.module.css docblock). */}
			<nav
				aria-label="Settings categories"
				style={{
					width: "220px",
					flexShrink: 0,
					overflowY: "auto",
					borderRight:
						"var(--stella-border-width) solid var(--stella-border-default)",
					padding: "var(--stella-space-3)",
				}}>
				<FlexContainer
					direction="column"
					gap="1"
					style={{ width: "100%" }}>
					{schema.categories.map((category) => (
						<button
							key={category.id}
							type="button"
							className={[
								styles.navItem,
								category.id === activeId &&
									styles.navItemActive,
							]
								.filter(Boolean)
								.join(" ")}
							onClick={() => handleSelect(category.id)}
							aria-current={
								category.id === activeId ? "true" : undefined
							}>
							<span className={styles.navIcon}>
								{category.icon}
							</span>
							{category.label}
						</button>
					))}
				</FlexContainer>
			</nav>

			{/* Properties */}
			<div
				style={{
					flex: 1,
					minWidth: 0,
					overflowY: "auto",
					padding: "var(--stella-space-6)",
				}}>
				{activeCategory && (
					<SettingsCategoryPanel
						category={activeCategory}
						values={values[activeCategory.id] ?? {}}
						onFieldChange={(key, value) =>
							onChange(activeCategory.id, key, value)
						}
					/>
				)}
			</div>
		</FlexContainer>
	);
}

SettingsMenu.displayName = "SettingsMenu";

// ============================================================================
// INTERNAL: CATEGORY PANEL
// (not exported — decomposition detail of SettingsMenu, not a new atom)
// ============================================================================

function SettingsCategoryPanel({
	category,
	values,
	onFieldChange,
}: {
	category: SettingsCategory;
	values: Record<string, SettingsFieldValue>;
	onFieldChange: (key: string, value: SettingsFieldValue) => void;
}) {
	return (
		<div>
			<Text
				variant="title-2"
				as="h2"
				style={{ marginBottom: "var(--stella-space-1)" }}>
				{category.label}
			</Text>
			{category.description && (
				<Text
					variant="body"
					color="secondary"
					as="p"
					style={{ marginBottom: "var(--stella-space-6)" }}>
					{category.description}
				</Text>
			)}
			{!category.description && (
				<div style={{ marginBottom: "var(--stella-space-4)" }} />
			)}

			<FlexContainer
				direction="column"
				gap="0">
				{category.fields.map((field, idx) => (
					<Fragment key={field.key}>
						<div style={{ padding: "var(--stella-space-4) 0" }}>
							<SettingsFieldRow
								categoryId={category.id}
								field={field}
								value={values[field.key]}
								onChange={(value) =>
									onFieldChange(field.key, value)
								}
							/>
						</div>
						{idx < category.fields.length - 1 && (
							<Divider className={styles.rowDivider} />
						)}
					</Fragment>
				))}
			</FlexContainer>
		</div>
	);
}

// ============================================================================
// INTERNAL: FIELD ROW — dispatches on field.type to the matching atom
// ============================================================================

function SettingsFieldRow({
	categoryId,
	field,
	value,
	onChange,
}: {
	categoryId: string;
	field: SettingsField;
	value: SettingsFieldValue | undefined;
	onChange: (value: SettingsFieldValue) => void;
}) {
	const fieldId = useId();

	if (field.type === "boolean") {
		return (
			<FlexContainer
				justify="between"
				align="center"
				gap="4">
				{/* Whole label block is clickable (title + description), matching
            libadwaita's ActionRow/SwitchRow convention of a large click target. */}
				<label
					htmlFor={fieldId}
					style={{ cursor: "pointer" }}>
					<Text
						as="span"
						variant="body-strong">
						{field.label}
					</Text>
					{field.description && (
						<Text
							as="p"
							variant="caption"
							color="secondary"
							style={{ marginTop: "var(--stella-space-1)" }}>
							{field.description}
						</Text>
					)}
				</label>
				<Switch
					id={fieldId}
					checked={Boolean(value)}
					onCheckedChange={onChange}
				/>
			</FlexContainer>
		);
	}

	if (field.type === "choice") {
		// Segmented control — ButtonIsland of Buttons with the `active`
		// state, for mutually-exclusive style picks (theme, rounding,
		// density). Mirrors the GTK view-switcher look used by the app's
		// own nav clusters; the chosen option shows the inverted `active`
		// fill instead of a radio dot.
		if (field.control === "segmented") {
			return (
				<fieldset style={{ border: "none", padding: 0, margin: 0 }}>
					<legend
						style={{
							padding: 0,
							marginBottom: "var(--stella-space-1)",
						}}>
						<Text
							as="span"
							variant="body-strong">
							{field.label}
						</Text>
					</legend>
					{field.description && (
						<Text
							as="p"
							variant="caption"
							color="secondary"
							style={{ marginBottom: "var(--stella-space-3)" }}>
							{field.description}
						</Text>
					)}
					<ButtonIsland size="sm">
						{field.options.map((option) => (
							<Button
								key={option.value}
								size="sm"
								active={value === option.value}
								aria-pressed={value === option.value}
								leadingIcon={option.icon}
								onClick={() => onChange(option.value)}>
								{option.label}
							</Button>
						))}
					</ButtonIsland>
				</fieldset>
			);
		}

		return (
			<fieldset style={{ border: "none", padding: 0, margin: 0 }}>
				<legend
					style={{
						padding: 0,
						marginBottom: "var(--stella-space-1)",
					}}>
					<Text
						as="span"
						variant="body-strong">
						{field.label}
					</Text>
				</legend>
				{field.description && (
					<Text
						as="p"
						variant="caption"
						color="secondary"
						style={{ marginBottom: "var(--stella-space-3)" }}>
						{field.description}
					</Text>
				)}
				<FlexContainer
					direction="column"
					gap="2">
					{field.options.map((option) => (
						<Radio
							key={option.value}
							name={`${categoryId}-${field.key}`}
							value={option.value}
							label={option.label}
							checked={value === option.value}
							onChange={() => onChange(option.value)}
						/>
					))}
				</FlexContainer>
			</fieldset>
		);
	}

	// text
	return (
		<div>
			<label
				htmlFor={fieldId}
				style={{
					display: "block",
					marginBottom: "var(--stella-space-1)",
				}}>
				<Text
					as="span"
					variant="body-strong">
					{field.label}
				</Text>
			</label>
			{field.description && (
				<Text
					as="p"
					variant="caption"
					color="secondary"
					style={{ marginBottom: "var(--stella-space-2)" }}>
					{field.description}
				</Text>
			)}
			<Input
				id={fieldId}
				value={typeof value === "string" ? value : ""}
				placeholder={field.placeholder}
				onChange={(e) => onChange(e.target.value)}
				style={{ maxWidth: "320px" }}
			/>
		</div>
	);
}

export type { SettingsMenuProps };
