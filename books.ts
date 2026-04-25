// Hardcoded mapping of user-facing book abbreviations to canonical Bible book numbers.
// Book numbers follow the standard 1–66 order (Genesis=1 … Revelation=66).

export const GERMAN_BOOKS: Record<string, number> = {
	// Pentateuch
	"1Mo": 1, // 1. Mose (Genesis)
	"2Mo": 2, // 2. Mose (Exodus)
	"3Mo": 3, // 3. Mose (Levitikus)
	"4Mo": 4, // 4. Mose (Numeri)
	"5Mo": 5, // 5. Mose (Deuteronomium)

	// Historical books
	"Jos": 6, // Josua
	"Ri": 7, // Richter
	"Ruth": 8, // Ruth
	"1Sa": 9, // 1. Samuel
	"2Sa": 10, // 2. Samuel
	"1Ko": 11, // 1. Könige
	"2Ko": 12, // 2. Könige
	"1Chr": 13, // 1. Chronik
	"2Chr": 14, // 2. Chronik
	"Esr": 15, // Esra
	"Neh": 16, // Nehemia
	"Est": 17, // Ester

	// Wisdom / poetry
	"Hi": 18, // Hiob
	"Ps": 19, // Psalmen
	"Spr": 20, // Sprüche
	"Pr": 21, // Prediger (Ecclesiastes)
	"Hoh": 22, // Hohes Lied

	// Major prophets
	"Jes": 23, // Jesaja
	"Jer": 24, // Jeremia
	"Kla": 25, // Klagelieder
	"Hes": 26, // Hesekiel
	"Dan": 27, // Daniel

	// Minor prophets
	"Hos": 28, // Hosea
	"Joel": 29, // Joel
	"Am": 30, // Amos
	"Ob": 31, // Obadja
	"Jona": 32, // Jona
	"Mi": 33, // Micha
	"Nah": 34, // Nahum
	"Hab": 35, // Habakuk
	"Ze": 36, // Zefanja
	"Hag": 37, // Haggai
	"Sach": 38, // Sacharja
	"Mal": 39, // Maleachi

	// Gospels & Acts
	"Mat": 40, // Matthäus
	"Mar": 41, // Markus
	"Luk": 42, // Lukas
	"Joh": 43, // Johannes
	"Apg": 44, // Apostelgeschichte

	// Pauline letters
	"Ro": 45, // Römer
	"1Kor": 46, // 1. Korinther
	"2Kor": 47, // 2. Korinther
	"Gal": 48, // Galater
	"Eph": 49, // Epheser
	"Php": 50, // Philipper
	"Kol": 51, // Kolosser
	"1Th": 52, // 1. Thessalonicher
	"2Th": 53, // 2. Thessalonicher
	"1Tim": 54, // 1. Timotheus
	"2Tim": 55, // 2. Timotheus
	"Tit": 56, // Titus
	"Phm": 57, // Philemon

	// General letters
	"Heb": 58, // Hebräer
	"Jak": 59, // Jakobus
	"1Pe": 60, // 1. Petrus
	"2Pe": 61, // 2. Petrus
	"1Joh": 62, // 1. Johannes
	"2Joh": 63, // 2. Johannes
	"3Joh": 64, // 3. Johannes
	"Jud": 65, // Judas

	// Prophecy
	"Off": 66, // Offenbarung
};
