import { format } from "date-fns";
import type { Locale } from "date-fns";
import {
	ar,
	bn,
	cs,
	da,
	de,
	enUS,
	es,
	fi,
	fr,
	he,
	hi,
	hr,
	hu,
	it,
	ja,
	ko,
	nl,
	pl,
	pt,
	ptBR,
	ru,
	sk,
	uk,
	vi,
	zhCN,
} from "date-fns/locale"; // import all locales we need

const locales: Record<string, Locale | undefined> = {
	ar,
	bn,
	cs,
	da,
	de,
	enUS,
	es,
	fi,
	fr,
	he,
	hi,
	hr,
	hu,
	it,
	ja,
	ko,
	nl,
	pl,
	pt,
	ptBR,
	ru,
	sk,
	uk,
	vi,
	zhCN,
}; // used to look up the required locale

// by providing a default string of 'PP' or any of its variants for `formatStr`
// it will format dates in whichever way is appropriate to the locale
export default function (date: Date | number, formatStr = "Pp"): string {
	return format(date, formatStr, {
		locale: locales[window.__localeId__ ?? ""], // or global.__localeId__
	});
}
