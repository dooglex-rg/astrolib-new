const swisseph = require("sweph");
const { ...constants } = require("./constants");
const ephemeris = require("ephemeris");
const jyotish = require("jyotish-modified");
const { calculateHouses } = require("./houses");
const grahas = require("jyotish-modified/src/grahas");
const nakshatras = require("./nakshatra");
const rashis = require("./rashi");

/**
 *
 * @param {String} star eg: 'sun', 'moon'
 * @param {Date} date Date when to calculate position
 */
function getUTCPosition(star, date) {
  return swisseph.swe_calc_ut(
    getJulianDay(date),
    constants.DICT[star],
    swisseph.SEFLG_EQUATORIAL | swisseph.SEFLG_MOSEPH // Equatorial Coordinates
  );
}

/**
 *
 * @param {String} fixedStar fixed star's name
 * @param {Date} date date
 */
function getUTCFixedStarPosition(fixedStar, date) {
  return swisseph.swe_fixstar_ut(fixedStar, getJulianDay(date), constants.FLAG);
}

/**
 *
 * @param {Date} date local date, will be converted to UTC.
 */
function getJulianDay(date) {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const hour = date.getUTCHours();
  return swisseph.swe_julday(year, month, day, hour, swisseph.SE_GREG_CAL);
}

/**
 *
 * @param {String} dateString local datetime object string
 * @param {Number} longitude longitude of the place
 * @param {Number} latitude latitude of the place
 * @param {Number} height altitude of the place
 */

function getAllPlanets(dateString, longitude, latitude, height) {
  return ephemeris.getAllPlanets(new Date(dateString), longitude, latitude, height);
}

/*
  Grahas: Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Rahu
  Ayanamsha in use is Lahiri (most common)
*/

/**
 * @param {String} dateString format YYYY-MM-DD
 * @param {String} timeString format HH:MM:SS
 * @param {Number} lat latitude
 * @param {Number} lng longitude
 * @param {Number} timezone timezone in hours
 */
function getBirthChart(dateString, timeString, lat, lng, timezone) {
  // console.log(calculateHouses({ dateString, timeString, lat, lng, timezone }));
  const grahaPositions = jyotish.grahas.getGrahasPosition(
    { dateString, timeString, lat, lng, timezone },
    { zodiacType: "S", houseType: "P" }
  );

  const birthChart = {
    aries: {
      rashi: "aries",
      signs: [],
    },
    taurus: {
      rashi: "taurus",
      signs: [],
    },
    gemini: {
      rashi: "gemini",
      signs: [],
    },
    cancer: {
      rashi: "cancer",
      signs: [],
    },
    leo: {
      rashi: "leo",
      signs: [],
    },
    virgo: {
      rashi: "virgo",
      signs: [],
    },
    libra: {
      rashi: "libra",
      signs: [],
    },
    scorpio: {
      rashi: "scorpio",
      signs: [],
    },
    sagittarius: {
      rashi: "sagittarius",
      signs: [],
    },
    capricorn: {
      rashi: "capricorn",
      signs: [],
    },
    aquarius: {
      rashi: "aquarius",
      signs: [],
    },
    pisces: {
      rashi: "pisces",
      signs: [],
    },
    meta: {},
  };

  Object.values(grahaPositions).map((graha) => {
    birthChart[constants.RASHIS[graha.rashi]].signs.push({
      graha: graha.graha,
      nakshatra: graha.nakshatra,
      longitude: graha.longitude,
      isRetrograde: graha.isRetrograde,
    });
    birthChart.meta[graha.graha] = {
      rashi: graha.rashi,
      graha: graha.graha,
      nakshatra: graha.nakshatra,
      longitude: graha.longitude,
      isRetrograde: graha.isRetrograde,
    };
  });

  return birthChart;
}

/**
 *
 * @param {Object} birthChart birthchart obtained from getBirthChart function
 */

function getNavamsaChart(birthChart) {
  const navamsaChart = {
    aries: {
      rashi: "aries",
      signs: [],
    },
    taurus: {
      rashi: "taurus",
      signs: [],
    },
    gemini: {
      rashi: "gemini",
      signs: [],
    },
    cancer: {
      rashi: "cancer",
      signs: [],
    },
    leo: {
      rashi: "leo",
      signs: [],
    },
    virgo: {
      rashi: "virgo",
      signs: [],
    },
    libra: {
      rashi: "libra",
      signs: [],
    },
    scorpio: {
      rashi: "scorpio",
      signs: [],
    },
    sagittarius: {
      rashi: "sagittarius",
      signs: [],
    },
    capricorn: {
      rashi: "capricorn",
      signs: [],
    },
    aquarius: {
      rashi: "aquarius",
      signs: [],
    },
    pisces: {
      rashi: "pisces",
      signs: [],
    },
    meta: {},
  };
  Object.values(birthChart).map((rashi) => {
    if (rashi.signs == undefined) {
      // metadata of birthchart should not be iterated. It won't be a rashi, it will be a graha inside metadata
      return;
    }
    rashi.signs.map((grah) => {
      const graha = JSON.parse(JSON.stringify(grah));
      const navamsa = whichNavamsa(graha.longitude); // A number between 1 - 9
      const navamsa_group_member = constants.REVERSE_RASHIS[constants.NAVAMSHA_GROUPS[rashi.rashi]];
      const position = constants.RASHI_MAP[navamsa_group_member] + 1;
      const calculated_navamsa_rashi_position = (position + navamsa - 1) % 12;
      const navamsa_rashi = constants.SKEWED_REVERSE_RASHI_MAP[calculated_navamsa_rashi_position];
      //calculting degree

      const reamining_nakshatra = (graha.longitude / (40 / 3)) % 1;
      const reamining_nakshatra_pad = (reamining_nakshatra * (40 / 3)) % (30 / 9);
      const full_degree =
        (calculated_navamsa_rashi_position - 1) * 30 + (reamining_nakshatra_pad * 9);
      graha.longitude = full_degree;

      navamsaChart[constants.RASHIS[navamsa_rashi]].signs.push(graha);
      navamsaChart.meta[graha.graha] = { ...graha, rashi: navamsa_rashi };
    });
  });

  return navamsaChart;
}

/**
 *
 * @param {Number} longitude Decimal Form of Longitude
 * @returns {Number} 1-9
 */
function whichNavamsa(longitude) {
  const fraction = longitude % 1;
  const remainder = Math.floor(longitude) % 30;
  const total_rem = remainder + fraction;
  let div = 1;
  for (var ele of constants.NAVAMSA_DIVISIONS) {
    if (total_rem <= ele) break;
    div++;
  }

  // the div here implies navamsa
  return div;
}

module.exports = {
  getUTCPosition,
  getJulianDay,
  getUTCFixedStarPosition,
  getAllPlanets,
  getBirthChart,
  getNavamsaChart,
  whichNavamsa,
  nakshatras,
  rashis,
};
