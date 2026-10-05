import LinearProgress from "@mui/material/LinearProgress";
import React, { Suspense } from "react";
import type { PassphraseGeneratorProps } from "./passphrase-generator";

const PassphraseGenerator = React.lazy(
	() =>
		import(
			/* webpackChunkName: "passphrase-generator" */ "./passphrase-generator"
		),
);

export default function LazyPassphraseGenerator(
	props: PassphraseGeneratorProps,
) {
	return (
		<Suspense fallback={<LinearProgress />}>
			<PassphraseGenerator {...props} />
		</Suspense>
	);
}
