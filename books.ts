// Single source of truth: [bookNumber, tagAbbreviation, displayAbbreviation]
// - tagAbbreviation:     used in #b/ tags (e.g. #b/Joh/3/16)
// - displayAbbreviation: jw.org standardAbbreviation, fetched once and embedded statically
const BOOKS_DATA: [number, string, string][] = [
	// Pentateuch
	[1,  "1Mo",  "1. Mo."],
	[2,  "2Mo",  "2. Mo."],
	[3,  "3Mo",  "3. Mo."],
	[4,  "4Mo",  "4. Mo."],
	[5,  "5Mo",  "5. Mo."],
	// Historical books
	[6,  "Jos",  "Jos."],
	[7,  "Ri",   "Ri."],
	[8,  "Ruth", "Ruth"],
	[9,  "1Sa",  "1. Sam."],
	[10, "2Sa",  "2. Sam."],
	[11, "1Ko",  "1. Kö."],
	[12, "2Ko",  "2. Kö."],
	[13, "1Chr", "1. Chr."],
	[14, "2Chr", "2. Chr."],
	[15, "Esr",  "Esra"],
	[16, "Neh",  "Neh."],
	[17, "Est",  "Esth."],
	// Wisdom / poetry
	[18, "Hi",   "Hiob"],
	[19, "Ps",   "Ps."],
	[20, "Spr",  "Spr."],
	[21, "Pr",   "Pred."],
	[22, "Hoh",  "Hoh."],
	// Major prophets
	[23, "Jes",  "Jes."],
	[24, "Jer",  "Jer."],
	[25, "Kla",  "Klag."],
	[26, "Hes",  "Hes."],
	[27, "Dan",  "Dan."],
	// Minor prophets
	[28, "Hos",  "Hos."],
	[29, "Joel", "Joel"],
	[30, "Am",   "Am."],
	[31, "Ob",   "Ob."],
	[32, "Jona", "Jona"],
	[33, "Mi",   "Mi."],
	[34, "Nah",  "Nah."],
	[35, "Hab",  "Hab."],
	[36, "Ze",   "Zeph."],
	[37, "Hag",  "Hag."],
	[38, "Sach", "Sach."],
	[39, "Mal",  "Mal."],
	// Gospels & Acts
	[40, "Mat",  "Mat."],
	[41, "Mar",  "Mar."],
	[42, "Luk",  "Luk."],
	[43, "Joh",  "Joh."],
	[44, "Apg",  "Apg."],
	// Pauline letters
	[45, "Ro",   "Röm."],
	[46, "1Kor", "1. Kor."],
	[47, "2Kor", "2. Kor."],
	[48, "Gal",  "Gal."],
	[49, "Eph",  "Eph."],
	[50, "Php",  "Phil."],
	[51, "Kol",  "Kol."],
	[52, "1Th",  "1. Thes."],
	[53, "2Th",  "2. Thes."],
	[54, "1Tim", "1. Tim."],
	[55, "2Tim", "2. Tim."],
	[56, "Tit",  "Tit."],
	[57, "Phm",  "Philem."],
	// General letters
	[58, "Heb",  "Heb."],
	[59, "Jak",  "Jak."],
	[60, "1Pe",  "1. Pet."],
	[61, "2Pe",  "2. Pet."],
	[62, "1Joh", "1. Joh."],
	[63, "2Joh", "2. Joh."],
	[64, "3Joh", "3. Joh."],
	[65, "Jud",  "Jud."],
	// Prophecy
	[66, "Off",  "Offb."],
];

export const GERMAN_BOOKS: Record<string, number> =
	Object.fromEntries(BOOKS_DATA.map(([nr, tag]) => [tag, nr]));

export const GERMAN_BOOK_ABBREVIATIONS: Record<number, string> =
	Object.fromEntries(BOOKS_DATA.map(([nr, , abbr]) => [nr, abbr]));
