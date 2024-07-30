const countries = [
    {
        code: 'AD',
        label: 'ANDORRA',
        phone: '376'
    },
    {
        code: 'AE',
        label: 'UNITED_ARAB_EMIRATES',
        phone: '971',

    },
    {
        code: 'AF',
        label: 'AFGHANISTAN',
        phone: '93'
    },
    {
        code: 'AG',
        label: 'ANTIGUA_AND_BARBUDA',
        phone: '1-268',

    },
    {
        code: 'AI',
        label: 'ANGUILLA',
        phone: '1-264'
    },
    {
        code: 'AL',
        label: 'ALBANIA',
        phone: '355'
    },
    {
        code: 'AM',
        label: 'ARMENIA',
        phone: '374'
    },
    {
        code: 'AO',
        label: 'ANGOLA',
        phone: '244'
    },
    {
        code: 'AQ',
        label: 'ANTARCTICA',
        phone: '672'
    },
    {
        code: 'AR',
        label: 'ARGENTINA',
        phone: '54'
    },
    {
        code: 'AS',
        label: 'AMERICAN_SAMOA',
        phone: '1-684'
    },
    {
        code: 'AT',
        label: 'AUSTRIA',
        phone: '43'
    },
    {
        code: 'AU',
        label: 'AUSTRALIA',
        phone: '61',

    },
    {
        code: 'AW',
        label: 'ARUBA',
        phone: '297'
    },
    {
        code: 'AX',
        label: 'ALLAND_ISLANDS',
        phone: '358'
    },
    {
        code: 'AZ',
        label: 'AZERBAIJAN',
        phone: '994'
    },
    {
        code: 'BA',
        label: 'BOSNIA_AND_HERZEGOVINA',
        phone: '387',

    },
    {
        code: 'BB',
        label: 'BARBADOS',
        phone: '1-246'
    },
    {
        code: 'BD',
        label: 'BANGLADESH',
        phone: '880'
    },
    {
        code: 'BE',
        label: 'BELGIUM',
        phone: '32'
    },
    {
        code: 'BF',
        label: 'BURKINA_FASO',
        phone: '226'
    },
    {
        code: 'BG',
        label: 'BULGARIA',
        phone: '359'
    },
    {
        code: 'BH',
        label: 'BAHRAIN',
        phone: '973'
    },
    {
        code: 'BI',
        label: 'BURUNDI',
        phone: '257'
    },
    {
        code: 'BJ',
        label: 'BENIN',
        phone: '229'
    },
    {
        code: 'BL',
        label: 'SAINT_BARTHELEMY',
        phone: '590'
    },
    {
        code: 'BM',
        label: 'BERMUDA',
        phone: '1-441'
    },
    {
        code: 'BN',
        label: 'BRUNEI_DARUSSALAM',
        phone: '673'
    },
    {
        code: 'BO',
        label: 'BOLIVIA',
        phone: '591'
    },
    {
        code: 'BR',
        label: 'BRAZIL',
        phone: '55'
    },
    {
        code: 'BS',
        label: 'BAHAMAS',
        phone: '1-242'
    },
    {
        code: 'BT',
        label: 'BHUTAN',
        phone: '975'
    },
    {
        code: 'BV',
        label: 'BOUVET_ISLAND',
        phone: '47'
    },
    {
        code: 'BW',
        label: 'BOTSWANA',
        phone: '267'
    },
    {
        code: 'BY',
        label: 'BELARUS',
        phone: '375'
    },
    {
        code: 'BZ',
        label: 'BELIZE',
        phone: '501'
    },
    {
        code: 'CA',
        label: 'CANADA',
        phone: '1',

    },
    {
        code: 'CC',
        label: 'COCOS_KEELING_ISLANDS',
        phone: '61',

    },
    {
        code: 'CD',
        label: 'CONGO_DEMOCRATIC_REPUBLIC_OF_THE',
        phone: '243',

    },
    {
        code: 'CF',
        label: 'CENTRAL_AFRICAN_REPUBLIC',
        phone: '236',

    },
    {
        code: 'CG',
        label: 'CONGO_REPUBLIC_OF_THE',
        phone: '242',

    },
    {
        code: 'CH',
        label: 'SWITZERLAND',
        phone: '41'
    },
    {
        code: 'CI',
        label: "COTE_D_IVOIRE",
        phone: '225'
    },
    {
        code: 'CK',
        label: 'COOK_ISLANDS',
        phone: '682'
    },
    {
        code: 'CL',
        label: 'CHILE',
        phone: '56'
    },
    {
        code: 'CM',
        label: 'CAMEROON',
        phone: '237'
    },
    {
        code: 'CN',
        label: 'CHINA',
        phone: '86'
    },
    {
        code: 'CO',
        label: 'COLOMBIA',
        phone: '57'
    },
    {
        code: 'CR',
        label: 'COSTA_RICA',
        phone: '506'
    },
    {
        code: 'CU',
        label: 'CUBA',
        phone: '53'
    },
    {
        code: 'CV',
        label: 'CAPE_VERDE',
        phone: '238'
    },
    {
        code: 'CW',
        label: 'CURACAO',
        phone: '599'
    },
    {
        code: 'CX',
        label: 'CHRISTMAS_ISLAND',
        phone: '61'
    },
    {
        code: 'CY',
        label: 'CYPRUS',
        phone: '357'
    },
    {
        code: 'CZ',
        label: 'CZECH_REPUBLIC',
        phone: '420'
    },
    {
        code: 'DE',
        label: 'GERMANY',
        phone: '49',

    },
    {
        code: 'DJ',
        label: 'DJIBOUTI',
        phone: '253'
    },
    {
        code: 'DK',
        label: 'DENMARK',
        phone: '45'
    },
    {
        code: 'DM',
        label: 'DOMINICA',
        phone: '1-767'
    },
    {
        code: 'DO',
        label: 'DOMINICAN_REPUBLIC',
        phone: '1-809',

    },
    {
        code: 'DZ',
        label: 'ALGERIA',
        phone: '213'
    },
    {
        code: 'EC',
        label: 'ECUADOR',
        phone: '593'
    },
    {
        code: 'EE',
        label: 'ESTONIA',
        phone: '372'
    },
    {
        code: 'EG',
        label: 'EGYPT',
        phone: '20'
    },
    {
        code: 'EH',
        label: 'WESTERN_SAHARA',
        phone: '212'
    },
    {
        code: 'ER',
        label: 'ERITREA',
        phone: '291'
    },
    {
        code: 'ES',
        label: 'SPAIN',
        phone: '34'
    },
    {
        code: 'ET',
        label: 'ETHIOPIA',
        phone: '251'
    },
    {
        code: 'FI',
        label: 'FINLAND',
        phone: '358'
    },
    {
        code: 'FJ',
        label: 'FIJI',
        phone: '679'
    },
    {
        code: 'FK',
        label: 'FALKLAND_ISLANDS_MALVINAS',
        phone: '500',

    },
    {
        code: 'FM',
        label: 'MICRONESIA_FEDERATED_STATES_OF',
        phone: '691',

    },
    {
        code: 'FO',
        label: 'FAROE_ISLANDS',
        phone: '298'
    },
    {
        code: 'FR',
        label: 'FRANCE',
        phone: '33',

    },
    {
        code: 'GA',
        label: 'GABON',
        phone: '241'
    },
    {
        code: 'GB',
        label: 'UNITED_KINGDOM',
        phone: '44'
    },
    {
        code: 'GD',
        label: 'GRENADA',
        phone: '1-473'
    },
    {
        code: 'GE',
        label: 'GEORGIA',
        phone: '995'
    },
    {
        code: 'GF',
        label: 'FRENCH_GUIANA',
        phone: '594'
    },
    {
        code: 'GG',
        label: 'GUERNSEY',
        phone: '44'
    },
    {
        code: 'GH',
        label: 'GHANA',
        phone: '233'
    },
    {
        code: 'GI',
        label: 'GIBRALTAR',
        phone: '350'
    },
    {
        code: 'GL',
        label: 'GREENLAND',
        phone: '299'
    },
    {
        code: 'GM',
        label: 'GAMBIA',
        phone: '220'
    },
    {
        code: 'GN',
        label: 'GUINEA',
        phone: '224'
    },
    {
        code: 'GP',
        label: 'GUADELOUPE',
        phone: '590'
    },
    {
        code: 'GQ',
        label: 'EQUATORIAL_GUINEA',
        phone: '240'
    },
    {
        code: 'GR',
        label: 'GREECE',
        phone: '30'
    },
    {
        code: 'GS',
        label: 'SOUTH_GEORGIA_AND_THE_SOUTH_SANDWICH_ISLANDS',
        phone: '500',

    },
    {
        code: 'GT',
        label: 'GUATEMALA',
        phone: '502'
    },
    {
        code: 'GU',
        label: 'GUAM',
        phone: '1-671'
    },
    {
        code: 'GW',
        label: 'GUINEA',
        phone: '245'
    },
    {
        code: 'GY',
        label: 'GUYANA',
        phone: '592'
    },
    {
        code: 'HK',
        label: 'HONG_KONG',
        phone: '852'
    },
    {
        code: 'HM',
        label: 'HEARD_ISLAND_AND_MCDONALD_ISLANDS',
        phone: '672',

    },
    {
        code: 'HN',
        label: 'HONDURAS',
        phone: '504'
    },
    {
        code: 'HR',
        label: 'CROATIA',
        phone: '385'
    },
    {
        code: 'HT',
        label: 'HAITI',
        phone: '509'
    },
    {
        code: 'HU',
        label: 'HUNGARY',
        phone: '36'
    },
    {
        code: 'ID',
        label: 'INDONESIA',
        phone: '62'
    },
    {
        code: 'IE',
        label: 'IRELAND',
        phone: '353'
    },
    {
        code: 'IL',
        label: 'ISRAEL',
        phone: '972'
    },
    {
        code: 'IM',
        label: 'ISLE_OF_MAN',
        phone: '44'
    },
    {
        code: 'IN',
        label: 'INDIA',
        phone: '91'
    },
    {
        code: 'IO',
        label: 'BRITISH_INDIAN_OCEAN_TERRITORY',
        phone: '246',

    },
    {
        code: 'IQ',
        label: 'IRAQ',
        phone: '964'
    },
    {
        code: 'IR',
        label: 'IRAN_ISLAMIC_REPUBLIC_OF',
        phone: '98',

    },
    {
        code: 'IS',
        label: 'ICELAND',
        phone: '354'
    },
    {
        code: 'IT',
        label: 'ITALY',
        phone: '39'
    },
    {
        code: 'JE',
        label: 'JERSEY',
        phone: '44'
    },
    {
        code: 'JM',
        label: 'JAMAICA',
        phone: '1-876'
    },
    {
        code: 'JO',
        label: 'JORDAN',
        phone: '962'
    },
    {
        code: 'JP',
        label: 'JAPAN',
        phone: '81',

    },
    {
        code: 'KE',
        label: 'KENYA',
        phone: '254'
    },
    {
        code: 'KG',
        label: 'KYRGYZSTAN',
        phone: '996'
    },
    {
        code: 'KH',
        label: 'CAMBODIA',
        phone: '855'
    },
    {
        code: 'KI',
        label: 'KIRIBATI',
        phone: '686'
    },
    {
        code: 'KM',
        label: 'COMOROS',
        phone: '269'
    },
    {
        code: 'KN',
        label: 'SAINT_KITTS_AND_NEVIS',
        phone: '1-869',

    },
    {
        code: 'KP',
        label: "KOREA_DEMOCRATIC_PEOPLE_S_REPUBLIC_OF",
        phone: '850',

    },
    {
        code: 'KR',
        label: 'KOREA_REPUBLIC_OF',
        phone: '82'
    },
    {
        code: 'KW',
        label: 'KUWAIT',
        phone: '965'
    },
    {
        code: 'KY',
        label: 'CAYMAN_ISLANDS',
        phone: '1-345'
    },
    {
        code: 'KZ',
        label: 'KAZAKHSTAN',
        phone: '7'
    },
    {
        code: 'LA',
        label: "LAO_PEOPLE",
        phone: '856',

    },
    {
        code: 'LB',
        label: 'LEBANON',
        phone: '961'
    },
    {
        code: 'LC',
        label: 'SAINT_LUCIA',
        phone: '1-758'
    },
    {
        code: 'LI',
        label: 'LIECHTENSTEIN',
        phone: '423'
    },
    {
        code: 'LK',
        label: 'SRI_LANKA',
        phone: '94'
    },
    {
        code: 'LR',
        label: 'LIBERIA',
        phone: '231'
    },
    {
        code: 'LS',
        label: 'LESOTHO',
        phone: '266'
    },
    {
        code: 'LT',
        label: 'LITHUANIA',
        phone: '370'
    },
    {
        code: 'LU',
        label: 'LUXEMBOURG',
        phone: '352'
    },
    {
        code: 'LV',
        label: 'LATVIA',
        phone: '371'
    },
    {
        code: 'LY',
        label: 'LIBYA',
        phone: '218'
    },
    {
        code: 'MA',
        label: 'MOROCCO',
        phone: '212'
    },
    {
        code: 'MC',
        label: 'MONACO',
        phone: '377'
    },
    {
        code: 'MD',
        label: 'MOLDOVA_REPUBLIC_OF',
        phone: '373',

    },
    {
        code: 'ME',
        label: 'MONTENEGRO',
        phone: '382'
    },
    {
        code: 'MF',
        label: 'SAINT_MARTIN_FRENCH_PART',
        phone: '590',

    },
    {
        code: 'MG',
        label: 'MADAGASCAR',
        phone: '261'
    },
    {
        code: 'MH',
        label: 'MARSHALL_ISLANDS',
        phone: '692'
    },
    {
        code: 'MK',
        label: 'MACEDONIA_THE_FORMER_YUGOSLAV_REPUBLIC_OF',
        phone: '389',

    },
    {
        code: 'ML',
        label: 'MALI',
        phone: '223'
    },
    {
        code: 'MM',
        label: 'MYANMAR',
        phone: '95'
    },
    {
        code: 'MN',
        label: 'MONGOLIA',
        phone: '976'
    },
    {
        code: 'MO',
        label: 'MACAO',
        phone: '853'
    },
    {
        code: 'MP',
        label: 'NORTHERN_MARIANA_ISLANDS',
        phone: '1-670',

    },
    {
        code: 'MQ',
        label: 'MARTINIQUE',
        phone: '596'
    },
    {
        code: 'MR',
        label: 'MAURITANIA',
        phone: '222'
    },
    {
        code: 'MS',
        label: 'MONTSERRAT',
        phone: '1-664'
    },
    {
        code: 'MT',
        label: 'MALTA',
        phone: '356'
    },
    {
        code: 'MU',
        label: 'MAURITIUS',
        phone: '230'
    },
    {
        code: 'MV',
        label: 'MALDIVES',
        phone: '960'
    },
    {
        code: 'MW',
        label: 'MALAWI',
        phone: '265'
    },
    {
        code: 'MX',
        label: 'MEXICO',
        phone: '52'
    },
    {
        code: 'MY',
        label: 'MALAYSIA',
        phone: '60'
    },
    {
        code: 'MZ',
        label: 'MOZAMBIQUE',
        phone: '258'
    },
    {
        code: 'NA',
        label: 'NAMIBIA',
        phone: '264'
    },
    {
        code: 'NC',
        label: 'NEW_CALEDONIA',
        phone: '687'
    },
    {
        code: 'NE',
        label: 'NIGER',
        phone: '227'
    },
    {
        code: 'NF',
        label: 'NORFOLK_ISLAND',
        phone: '672'
    },
    {
        code: 'NG',
        label: 'NIGERIA',
        phone: '234'
    },
    {
        code: 'NI',
        label: 'NICARAGUA',
        phone: '505'
    },
    {
        code: 'NL',
        label: 'NETHERLANDS',
        phone: '31'
    },
    {
        code: 'NO',
        label: 'NORWAY',
        phone: '47'
    },
    {
        code: 'NP',
        label: 'NEPAL',
        phone: '977'
    },
    {
        code: 'NR',
        label: 'NAURU',
        phone: '674'
    },
    {
        code: 'NU',
        label: 'NIUE',
        phone: '683'
    },
    {
        code: 'NZ',
        label: 'NEW_ZEALAND',
        phone: '64'
    },
    {
        code: 'OM',
        label: 'OMAN',
        phone: '968'
    },
    {
        code: 'PA',
        label: 'PANAMA',
        phone: '507'
    },
    {
        code: 'PE',
        label: 'PERU',
        phone: '51'
    },
    {
        code: 'PF',
        label: 'FRENCH_POLYNESIA',
        phone: '689'
    },
    {
        code: 'PG',
        label: 'PAPUA_NEW_GUINEA',
        phone: '675'
    },
    {
        code: 'PH',
        label: 'PHILIPPINES',
        phone: '63'
    },
    {
        code: 'PK',
        label: 'PAKISTAN',
        phone: '92'
    },
    {
        code: 'PL',
        label: 'POLAND',
        phone: '48'
    },
    {
        code: 'PM',
        label: 'SAINT_PIERRE_AND_MIQUELON',
        phone: '508',

    },
    {
        code: 'PN',
        label: 'PITCAIRN',
        phone: '870'
    },
    {
        code: 'PR',
        label: 'PUERTO_RICO',
        phone: '1'
    },
    {
        code: 'PS',
        label: 'PALESTINE_STATE_OF',
        phone: '970',

    },
    {
        code: 'PT',
        label: 'PORTUGAL',
        phone: '351'
    },
    {
        code: 'PW',
        label: 'PALAU',
        phone: '680'
    },
    {
        code: 'PY',
        label: 'PARAGUAY',
        phone: '595'
    },
    {
        code: 'QA',
        label: 'QATAR',
        phone: '974'
    },
    {
        code: 'RE',
        label: 'REUNION',
        phone: '262'
    },
    {
        code: 'RO',
        label: 'ROMANIA',
        phone: '40'
    },
    {
        code: 'RS',
        label: 'SERBIA',
        phone: '381'
    },
    {
        code: 'RU',
        label: 'RUSSIAN_FEDERATION',
        phone: '7'
    },
    {
        code: 'RW',
        label: 'RWANDA',
        phone: '250'
    },
    {
        code: 'SA',
        label: 'SAUDI_ARABIA',
        phone: '966'
    },
    {
        code: 'SB',
        label: 'SOLOMON_ISLANDS',
        phone: '677'
    },
    {
        code: 'SC',
        label: 'SEYCHELLES',
        phone: '248'
    },
    {
        code: 'SD',
        label: 'SUDAN',
        phone: '249'
    },
    {
        code: 'SE',
        label: 'SWEDEN',
        phone: '46'
    },
    {
        code: 'SG',
        label: 'SINGAPORE',
        phone: '65'
    },
    {
        code: 'SH',
        label: 'SAINT_HELENA',
        phone: '290'
    },
    {
        code: 'SI',
        label: 'SLOVENIA',
        phone: '386'
    },
    {
        code: 'SJ',
        label: 'SVALBARD_AND_JAN_MAYEN',
        phone: '47',

    },
    {
        code: 'SK',
        label: 'SLOVAKIA',
        phone: '421'
    },
    {
        code: 'SL',
        label: 'SIERRA_LEONE',
        phone: '232'
    },
    {
        code: 'SM',
        label: 'SAN_MARINO',
        phone: '378'
    },
    {
        code: 'SN',
        label: 'SENEGAL',
        phone: '221'
    },
    {
        code: 'SO',
        label: 'SOMALIA',
        phone: '252'
    },
    {
        code: 'SR',
        label: 'SURINAME',
        phone: '597'
    },
    {
        code: 'SS',
        label: 'SOUTH_SUDAN',
        phone: '211'
    },
    {
        code: 'ST',
        label: 'SAO_TOME_AND_PRINCIPE',
        phone: '239',

    },
    {
        code: 'SV',
        label: 'EL_SALVADOR',
        phone: '503'
    },
    {
        code: 'SX',
        label: 'SINT_MAARTEN_DUTCH_PART',
        phone: '1-721',

    },
    {
        code: 'SY',
        label: 'SYRIAN_ARAB_REPUBLIC',
        phone: '963',

    },
    {
        code: 'SZ',
        label: 'SWAZILAND',
        phone: '268'
    },
    {
        code: 'TC',
        label: 'TURKS_AND_CAICOS_ISLANDS',
        phone: '1-649',

    },
    {
        code: 'TD',
        label: 'CHAD',
        phone: '235'
    },
    {
        code: 'TF',
        label: 'FRENCH_SOUTHERN_TERRITORIES',
        phone: '262',

    },
    {
        code: 'TG',
        label: 'TOGO',
        phone: '228'
    },
    {
        code: 'TH',
        label: 'THAILAND',
        phone: '66'
    },
    {
        code: 'TJ',
        label: 'TAJIKISTAN',
        phone: '992'
    },
    {
        code: 'TK',
        label: 'TOKELAU',
        phone: '690'
    },
    {
        code: 'TL',
        label: 'TIMOR',
        phone: '670'
    },
    {
        code: 'TM',
        label: 'TURKMENISTAN',
        phone: '993'
    },
    {
        code: 'TN',
        label: 'TUNISIA',
        phone: '216'
    },
    {
        code: 'TO',
        label: 'TONGA',
        phone: '676'
    },
    {
        code: 'TR',
        label: 'TURKEY',
        phone: '90'
    },
    {
        code: 'TT',
        label: 'TRINIDAD_AND_TOBAGO',
        phone: '1-868',

    },
    {
        code: 'TV',
        label: 'TUVALU',
        phone: '688'
    },
    {
        code: 'TW',
        label: 'TAIWAN_REPUBLIC_OF_CHINA',
        phone: '886',

    },
    {
        code: 'TZ',
        label: 'UNITED_REPUBLIC_OF_TANZANIA',
        phone: '255',

    },
    {
        code: 'UA',
        label: 'UKRAINE',
        phone: '380'
    },
    {
        code: 'UG',
        label: 'UGANDA',
        phone: '256'
    },
    {
        code: 'US',
        label: 'UNITED_STATES',
        phone: '1',

    },
    {
        code: 'UY',
        label: 'URUGUAY',
        phone: '598'
    },
    {
        code: 'UZ',
        label: 'UZBEKISTAN',
        phone: '998'
    },
    {
        code: 'VA',
        label: 'HOLY_SEE_VATICAN_CITY_STATE',
        phone: '379',

    },
    {
        code: 'VC',
        label: 'SAINT_VINCENT_AND_THE_GRENADINES',
        phone: '1-784',

    },
    {
        code: 'VE',
        label: 'VENEZUELA',
        phone: '58'
    },
    {
        code: 'VG',
        label: 'BRITISH_VIRGIN_ISLANDS',
        phone: '1-284',

    },
    {
        code: 'VI',
        label: 'US_VIRGIN_ISLANDS',
        phone: '1-340',

    },
    {
        code: 'VN',
        label: 'VIETNAM',
        phone: '84'
    },
    {
        code: 'VU',
        label: 'VANUATU',
        phone: '678'
    },
    {
        code: 'WF',
        label: 'WALLIS_AND_FUTUNA',
        phone: '681'
    },
    {
        code: 'WS',
        label: 'SAMOA',
        phone: '685'
    },
    {
        code: 'XK',
        label: 'KOSOVO',
        phone: '383'
    },
    {
        code: 'YE',
        label: 'YEMEN',
        phone: '967'
    },
    {
        code: 'YT',
        label: 'MAYOTTE',
        phone: '262'
    },
    {
        code: 'ZA',
        label: 'SOUTH_AFRICA',
        phone: '27'
    },
    {
        code: 'ZM',
        label: 'ZAMBIA',
        phone: '260'
    },
    {
        code: 'ZW',
        label: 'ZIMBABWE',
        phone: '263'
    },

];

export default countries