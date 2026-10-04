import { LinearProgress, Typography } from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";

export default function GeneratorStrength({
	entropy,
	mode,
}: {
	entropy?: number;
	mode: "password" | "passphrase";
}) {
	const { t } = useTranslation();
	const prefix = mode === "passphrase" ? "PASSPHRASE" : "PASSWORD";
	if (entropy === undefined || !Number.isFinite(entropy) || entropy < 0) {
		return (
			<Typography variant="caption">{t(`${prefix}_ENTROPY_EDITED`)}</Typography>
		);
	}
	const strength =
		entropy < 40
			? "WEAK"
			: entropy < 60
				? "MODERATE"
				: entropy < 80
					? "STRONG"
					: "VERY_STRONG";
	return (
		<>
			<LinearProgress
				variant="determinate"
				value={Math.min(100, entropy)}
				color={entropy < 40 ? "error" : entropy < 60 ? "warning" : "success"}
				aria-label={t(`${prefix}_STRENGTH`)}
			/>
			<Typography variant="body2" style={{ marginTop: 4 }}>
				{t(`${prefix}_ENTROPY`, {
					bits: entropy.toFixed(1),
					strength: t(strength),
				})}
			</Typography>
			<Typography variant="caption">
				{t(`${prefix}_ENTROPY_DESCRIPTION`)}
			</Typography>
		</>
	);
}
