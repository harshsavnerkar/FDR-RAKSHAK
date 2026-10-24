/**
 * Comprehensive list of all 28 States and 8 Union Territories in India,
 * along with PIN code detection for automatic city/state resolution.
 */

export const ALL_INDIAN_STATES_AND_UTS = [
  // 28 States
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  // 8 Union Territories
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi NCT",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry"
];

// Major Indian cities and postal circles prefix dictionary
const PIN_PREFIX_MAP = {
  // Delhi NCT
  "110": { city: "New Delhi", state: "Delhi NCT" },
  
  // Haryana
  "121": { city: "Faridabad", state: "Haryana" },
  "122": { city: "Gurugram", state: "Haryana" },
  "124": { city: "Rohtak", state: "Haryana" },
  "125": { city: "Hisar", state: "Haryana" },
  "131": { city: "Sonipat", state: "Haryana" },
  "132": { city: "Panipat", state: "Haryana" },
  "133": { city: "Ambala", state: "Haryana" },
  "134": { city: "Panchkula", state: "Haryana" },
  "135": { city: "Yamunanagar", state: "Haryana" },
  "136": { city: "Kurukshetra", state: "Haryana" },

  // Punjab
  "140": { city: "Mohali", state: "Punjab" },
  "141": { city: "Ludhiana", state: "Punjab" },
  "143": { city: "Amritsar", state: "Punjab" },
  "144": { city: "Jalandhar", state: "Punjab" },
  "147": { city: "Patiala", state: "Punjab" },
  "151": { city: "Bathinda", state: "Punjab" },

  // Chandigarh
  "160": { city: "Chandigarh", state: "Chandigarh" },

  // Himachal Pradesh
  "171": { city: "Shimla", state: "Himachal Pradesh" },
  "172": { city: "Solan", state: "Himachal Pradesh" },
  "175": { city: "Mandi", state: "Himachal Pradesh" },
  "176": { city: "Dharamshala", state: "Himachal Pradesh" },

  // Jammu & Kashmir and Ladakh
  "180": { city: "Jammu", state: "Jammu and Kashmir" },
  "190": { city: "Srinagar", state: "Jammu and Kashmir" },
  "194": { city: "Leh", state: "Ladakh" },

  // Uttar Pradesh
  "201": { city: "Noida / Ghaziabad", state: "Uttar Pradesh" },
  "202": { city: "Aligarh", state: "Uttar Pradesh" },
  "203": { city: "Bulandshahr", state: "Uttar Pradesh" },
  "204": { city: "Hathras", state: "Uttar Pradesh" },
  "208": { city: "Kanpur", state: "Uttar Pradesh" },
  "209": { city: "Kanpur Dehat", state: "Uttar Pradesh" },
  "211": { city: "Prayagraj", state: "Uttar Pradesh" },
  "221": { city: "Varanasi", state: "Uttar Pradesh" },
  "226": { city: "Lucknow", state: "Uttar Pradesh" },
  "228": { city: "Sultanpur", state: "Uttar Pradesh" },
  "243": { city: "Bareilly", state: "Uttar Pradesh" },
  "244": { city: "Moradabad", state: "Uttar Pradesh" },
  "247": { city: "Saharanpur", state: "Uttar Pradesh" },
  "250": { city: "Meerut", state: "Uttar Pradesh" },
  "281": { city: "Mathura", state: "Uttar Pradesh" },
  "282": { city: "Agra", state: "Uttar Pradesh" },

  // Uttarakhand
  "248": { city: "Dehradun", state: "Uttarakhand" },
  "249": { city: "Haridwar / Rishikesh", state: "Uttarakhand" },
  "262": { city: "Nainital / Haldwani", state: "Uttarakhand" },
  "263": { city: "Pantnagar", state: "Uttarakhand" },

  // Rajasthan
  "302": { city: "Jaipur", state: "Rajasthan" },
  "305": { city: "Ajmer", state: "Rajasthan" },
  "313": { city: "Udaipur", state: "Rajasthan" },
  "324": { city: "Kota", state: "Rajasthan" },
  "334": { city: "Bikaner", state: "Rajasthan" },
  "342": { city: "Jodhpur", state: "Rajasthan" },

  // Gujarat
  "380": { city: "Ahmedabad", state: "Gujarat" },
  "382": { city: "Gandhinagar", state: "Gujarat" },
  "388": { city: "Anand / Vallabh Vidyanagar", state: "Gujarat" },
  "390": { city: "Vadodara", state: "Gujarat" },
  "395": { city: "Surat", state: "Gujarat" },
  "396": { city: "Vapi / Valsad", state: "Gujarat" },
  "360": { city: "Rajkot", state: "Gujarat" },
  "361": { city: "Jamnagar", state: "Gujarat" },
  "364": { city: "Bhavnagar", state: "Gujarat" },

  // Maharashtra
  "400": { city: "Mumbai", state: "Maharashtra" },
  "401": { city: "Thane / Palghar", state: "Maharashtra" },
  "410": { city: "Navi Mumbai / Raigad", state: "Maharashtra" },
  "411": { city: "Pune", state: "Maharashtra" },
  "412": { city: "Pune Rural", state: "Maharashtra" },
  "413": { city: "Solapur", state: "Maharashtra" },
  "414": { city: "Ahmednagar", state: "Maharashtra" },
  "415": { city: "Satara / Ratnagiri", state: "Maharashtra" },
  "416": { city: "Kolhapur / Sangli", state: "Maharashtra" },
  "421": { city: "Kalyan / Dombivli", state: "Maharashtra" },
  "422": { city: "Nashik", state: "Maharashtra" },
  "423": { city: "Malegaon", state: "Maharashtra" },
  "424": { city: "Dhule / Jalgaon", state: "Maharashtra" },
  "431": { city: "Chhatrapati Sambhajinagar", state: "Maharashtra" },
  "440": { city: "Nagpur", state: "Maharashtra" },
  "442": { city: "Wardha / Chandrapur", state: "Maharashtra" },
  "444": { city: "Amravati / Akola", state: "Maharashtra" },

  // Goa
  "403": { city: "Panaji / Margao", state: "Goa" },

  // Madhya Pradesh
  "452": { city: "Indore", state: "Madhya Pradesh" },
  "456": { city: "Ujjain", state: "Madhya Pradesh" },
  "462": { city: "Bhopal", state: "Madhya Pradesh" },
  "474": { city: "Gwalior", state: "Madhya Pradesh" },
  "482": { city: "Jabalpur", state: "Madhya Pradesh" },

  // Chhattisgarh
  "490": { city: "Bhilai / Durg", state: "Chhattisgarh" },
  "492": { city: "Raipur", state: "Chhattisgarh" },
  "495": { city: "Bilaspur", state: "Chhattisgarh" },

  // Telangana
  "500": { city: "Hyderabad", state: "Telangana" },
  "501": { city: "Ranga Reddy", state: "Telangana" },
  "506": { city: "Warangal", state: "Telangana" },
  "505": { city: "Karimnagar", state: "Telangana" },

  // Andhra Pradesh
  "517": { city: "Tirupati", state: "Andhra Pradesh" },
  "520": { city: "Vijayawada", state: "Andhra Pradesh" },
  "522": { city: "Guntur", state: "Andhra Pradesh" },
  "530": { city: "Visakhapatnam", state: "Andhra Pradesh" },
  "533": { city: "Kakinada", state: "Andhra Pradesh" },
  "518": { city: "Kurnool", state: "Andhra Pradesh" },

  // Karnataka
  "560": { city: "Bengaluru", state: "Karnataka" },
  "562": { city: "Bengaluru Rural", state: "Karnataka" },
  "570": { city: "Mysuru", state: "Karnataka" },
  "574": { city: "Puttur / Mangalore", state: "Karnataka" },
  "575": { city: "Mangalore", state: "Karnataka" },
  "576": { city: "Udupi / Manipal", state: "Karnataka" },
  "577": { city: "Shivamogga / Davanagere", state: "Karnataka" },
  "580": { city: "Hubballi / Dharwad", state: "Karnataka" },
  "585": { city: "Kalaburagi", state: "Karnataka" },
  "590": { city: "Belagavi", state: "Karnataka" },

  // Tamil Nadu & Puducherry
  "600": { city: "Chennai", state: "Tamil Nadu" },
  "603": { city: "Kanchipuram / Chengalpattu", state: "Tamil Nadu" },
  "605": { city: "Puducherry", state: "Puducherry" },
  "607": { city: "Cuddalore", state: "Tamil Nadu" },
  "620": { city: "Tiruchirappalli", state: "Tamil Nadu" },
  "625": { city: "Madurai", state: "Tamil Nadu" },
  "627": { city: "Tirunelveli", state: "Tamil Nadu" },
  "629": { city: "Kanyakumari", state: "Tamil Nadu" },
  "632": { city: "Vellore", state: "Tamil Nadu" },
  "636": { city: "Salem", state: "Tamil Nadu" },
  "638": { city: "Erode", state: "Tamil Nadu" },
  "641": { city: "Coimbatore", state: "Tamil Nadu" },

  // Kerala & Lakshadweep
  "670": { city: "Kannur", state: "Kerala" },
  "673": { city: "Kozhikode", state: "Kerala" },
  "680": { city: "Thrissur", state: "Kerala" },
  "682": { city: "Kochi / Ernakulam", state: "Kerala" },
  "686": { city: "Kottayam", state: "Kerala" },
  "691": { city: "Kollam", state: "Kerala" },
  "695": { city: "Thiruvananthapuram", state: "Kerala" },
  "682555": { city: "Kavaratti", state: "Lakshadweep" },

  // West Bengal & Andaman
  "700": { city: "Kolkata", state: "West Bengal" },
  "711": { city: "Howrah", state: "West Bengal" },
  "713": { city: "Durgapur / Asansol", state: "West Bengal" },
  "721": { city: "Kharagpur / Midnapore", state: "West Bengal" },
  "734": { city: "Siliguri / Darjeeling", state: "West Bengal" },
  "744": { city: "Port Blair", state: "Andaman and Nicobar Islands" },

  // Odisha
  "751": { city: "Bhubaneswar", state: "Odisha" },
  "753": { city: "Cuttack", state: "Odisha" },
  "760": { city: "Berhampur", state: "Odisha" },
  "768": { city: "Sambalpur", state: "Odisha" },
  "769": { city: "Rourkela", state: "Odisha" },

  // North East States
  "781": { city: "Guwahati", state: "Assam" },
  "786": { city: "Dibrugarh", state: "Assam" },
  "791": { city: "Itanagar", state: "Arunachal Pradesh" },
  "793": { city: "Shillong", state: "Meghalaya" },
  "795": { city: "Imphal", state: "Manipur" },
  "796": { city: "Aizawl", state: "Mizoram" },
  "797": { city: "Kohima / Dimapur", state: "Nagaland" },
  "799": { city: "Agartala", state: "Tripura" },
  "737": { city: "Gangtok", state: "Sikkim" },

  // Bihar & Jharkhand
  "800": { city: "Patna", state: "Bihar" },
  "812": { city: "Bhagalpur", state: "Bihar" },
  "823": { city: "Gaya", state: "Bihar" },
  "826": { city: "Dhanbad", state: "Jharkhand" },
  "831": { city: "Jamshedpur", state: "Jharkhand" },
  "834": { city: "Ranchi", state: "Jharkhand" },
  "842": { city: "Muzaffarpur", state: "Bihar" },

  // Dadra & Nagar Haveli and Daman & Diu
  "396210": { city: "Daman", state: "Dadra and Nagar Haveli and Daman and Diu" },
  "396230": { city: "Silvassa", state: "Dadra and Nagar Haveli and Daman and Diu" },
};

// General 2-digit state fallback
const TWO_DIGIT_STATE_MAP = {
  "11": { city: "Delhi", state: "Delhi NCT" },
  "12": { city: "Haryana", state: "Haryana" },
  "13": { city: "Haryana", state: "Haryana" },
  "14": { city: "Punjab", state: "Punjab" },
  "15": { city: "Punjab", state: "Punjab" },
  "16": { city: "Chandigarh", state: "Chandigarh" },
  "17": { city: "Himachal Pradesh", state: "Himachal Pradesh" },
  "18": { city: "Jammu", state: "Jammu and Kashmir" },
  "19": { city: "Srinagar", state: "Jammu and Kashmir" },
  "20": { city: "Western UP", state: "Uttar Pradesh" },
  "21": { city: "Central UP", state: "Uttar Pradesh" },
  "22": { city: "Awadh UP", state: "Uttar Pradesh" },
  "23": { city: "Bundelkhand", state: "Uttar Pradesh" },
  "24": { city: "Rohilkhand / Garhwal", state: "Uttarakhand" },
  "25": { city: "Meerut Div", state: "Uttar Pradesh" },
  "26": { city: "Kumaon", state: "Uttarakhand" },
  "27": { city: "Eastern UP", state: "Uttar Pradesh" },
  "28": { city: "Braj UP", state: "Uttar Pradesh" },
  "30": { city: "Jaipur Div", state: "Rajasthan" },
  "31": { city: "Udaipur Div", state: "Rajasthan" },
  "32": { city: "Kota Div", state: "Rajasthan" },
  "33": { city: "Bikaner Div", state: "Rajasthan" },
  "34": { city: "Jodhpur Div", state: "Rajasthan" },
  "36": { city: "Saurashtra", state: "Gujarat" },
  "37": { city: "Kutch", state: "Gujarat" },
  "38": { city: "Central Gujarat", state: "Gujarat" },
  "39": { city: "South Gujarat", state: "Gujarat" },
  "40": { city: "Konkan / Goa", state: "Maharashtra" },
  "41": { city: "Western Maharashtra", state: "Maharashtra" },
  "42": { city: "Khandesh", state: "Maharashtra" },
  "43": { city: "Marathwada", state: "Maharashtra" },
  "44": { city: "Vidarbha", state: "Maharashtra" },
  "45": { city: "Malwa", state: "Madhya Pradesh" },
  "46": { city: "Bhopal Div", state: "Madhya Pradesh" },
  "47": { city: "Chambal", state: "Madhya Pradesh" },
  "48": { city: "Mahakoshal", state: "Madhya Pradesh" },
  "49": { city: "Chhattisgarh", state: "Chhattisgarh" },
  "50": { city: "Telangana", state: "Telangana" },
  "51": { city: "Rayalaseema", state: "Andhra Pradesh" },
  "52": { city: "Coastal Andhra", state: "Andhra Pradesh" },
  "53": { city: "North Coastal Andhra", state: "Andhra Pradesh" },
  "56": { city: "Bengaluru Urban", state: "Karnataka" },
  "57": { city: "South Karnataka", state: "Karnataka" },
  "58": { city: "Hyderabad-Karnataka", state: "Karnataka" },
  "59": { city: "North Karnataka", state: "Karnataka" },
  "60": { city: "Northern TN", state: "Tamil Nadu" },
  "61": { city: "Cauvery Delta", state: "Tamil Nadu" },
  "62": { city: "Southern TN", state: "Tamil Nadu" },
  "63": { city: "Western TN", state: "Tamil Nadu" },
  "64": { city: "Kongu Nadu", state: "Tamil Nadu" },
  "67": { city: "Malabar", state: "Kerala" },
  "68": { city: "Cochin Div", state: "Kerala" },
  "69": { city: "Travancore", state: "Kerala" },
  "70": { city: "Kolkata Metro", state: "West Bengal" },
  "71": { city: "Burdwan Div", state: "West Bengal" },
  "72": { city: "Medinipur Div", state: "West Bengal" },
  "73": { city: "North Bengal", state: "West Bengal" },
  "74": { city: "Presidency Div", state: "West Bengal" },
  "75": { city: "Coastal Odisha", state: "Odisha" },
  "76": { city: "Southern Odisha", state: "Odisha" },
  "77": { city: "Northern Odisha", state: "Odisha" },
  "78": { city: "Assam", state: "Assam" },
  "79": { city: "North East", state: "Assam" },
  "80": { city: "Central Bihar", state: "Bihar" },
  "81": { city: "East Bihar", state: "Bihar" },
  "82": { city: "South Bihar", state: "Bihar" },
  "83": { city: "Jharkhand", state: "Jharkhand" },
  "84": { city: "North Bihar", state: "Bihar" },
  "85": { city: "Santhal Parganas", state: "Bihar" },
};

/**
 * Automatically looks up city and state from a 6-digit Indian PIN code.
 */
export function detectLocationFromPinCode(pincode) {
  if (!pincode) return null;
  const cleanPin = String(pincode).trim().replace(/\D/g, '');
  if (cleanPin.length !== 6) return null;

  // 1. Try exact 6-digit match
  if (PIN_PREFIX_MAP[cleanPin]) {
    return PIN_PREFIX_MAP[cleanPin];
  }

  // 2. Try 3-digit prefix match
  const prefix3 = cleanPin.slice(0, 3);
  if (PIN_PREFIX_MAP[prefix3]) {
    return PIN_PREFIX_MAP[prefix3];
  }

  // 3. Try 2-digit circle fallback
  const prefix2 = cleanPin.slice(0, 2);
  if (TWO_DIGIT_STATE_MAP[prefix2]) {
    return TWO_DIGIT_STATE_MAP[prefix2];
  }

  return null;
}
