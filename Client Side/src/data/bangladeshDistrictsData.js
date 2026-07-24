/**
 * Bangladesh District Center Coordinates & Regional Zones
 * Used for reliable, offline-ready Choropleth & Interactive Map rendering.
 */

export const BANGLADESH_CENTER = [23.6850, 90.3563]; // Geographic center of Bangladesh
export const DEFAULT_ZOOM = 7;
export const DISTRICT_ZOOM = 11;

export const BANGLADESH_DISTRICTS = [
    { name: "Dhaka", center: [23.8103, 90.4125], division: "Dhaka", radiusMeters: 22000 },
    { name: "Gazipur", center: [23.9999, 90.4203], division: "Dhaka", radiusMeters: 25000 },
    { name: "Narayanganj", center: [23.6238, 90.5000], division: "Dhaka", radiusMeters: 18000 },
    { name: "Narsingdi", center: [23.9193, 90.7176], division: "Dhaka", radiusMeters: 20000 },
    { name: "Tangail", center: [24.2513, 89.9167], division: "Dhaka", radiusMeters: 30000 },
    { name: "Faridpur", center: [23.6071, 89.8425], division: "Dhaka", radiusMeters: 25000 },
    { name: "Manikganj", center: [23.8644, 90.0047], division: "Dhaka", radiusMeters: 22000 },
    { name: "Munshiganj", center: [23.5422, 90.5306], division: "Dhaka", radiusMeters: 18000 },
    { name: "Kishoreganj", center: [24.4449, 90.7766], division: "Dhaka", radiusMeters: 25000 },
    { name: "Gopalganj", center: [23.0051, 89.8266], division: "Dhaka", radiusMeters: 22000 },
    { name: "Madaripur", center: [23.1641, 90.1897], division: "Dhaka", radiusMeters: 20000 },
    { name: "Rajbari", center: [23.7574, 89.6444], division: "Dhaka", radiusMeters: 18000 },
    { name: "Shariatpur", center: [23.2423, 90.4348], division: "Dhaka", radiusMeters: 20000 },

    { name: "Chattogram", center: [22.3569, 91.7832], division: "Chattogram", radiusMeters: 35000 },
    { name: "Cox's Bazar", center: [21.4272, 92.0058], division: "Chattogram", radiusMeters: 30000 },
    { name: "Comilla", center: [23.4607, 91.1809], division: "Chattogram", radiusMeters: 28000 },
    { name: "Feni", center: [23.0159, 91.3976], division: "Chattogram", radiusMeters: 18000 },
    { name: "Noakhali", center: [22.8696, 91.0994], division: "Chattogram", radiusMeters: 25000 },
    { name: "Brahmanbaria", center: [23.9571, 91.1119], division: "Chattogram", radiusMeters: 24000 },
    { name: "Chandpur", center: [23.2333, 90.6667], division: "Chattogram", radiusMeters: 20000 },
    { name: "Lakshmipur", center: [22.9447, 90.8282], division: "Chattogram", radiusMeters: 20000 },
    { name: "Bandarban", center: [21.8311, 92.3686], division: "Chattogram", radiusMeters: 35000 },
    { name: "Rangamati", center: [22.6533, 92.1753], division: "Chattogram", radiusMeters: 40000 },
    { name: "Khagrachhari", center: [23.1193, 91.9847], division: "Chattogram", radiusMeters: 30000 },

    { name: "Sylhet", center: [24.8949, 91.8687], division: "Sylhet", radiusMeters: 30000 },
    { name: "Moulvibazar", center: [24.4829, 91.7774], division: "Sylhet", radiusMeters: 25000 },
    { name: "Habiganj", center: [24.3749, 91.4155], division: "Sylhet", radiusMeters: 24000 },
    { name: "Sunamganj", center: [25.0658, 91.3950], division: "Sylhet", radiusMeters: 32000 },

    { name: "Rajshahi", center: [24.3745, 88.6042], division: "Rajshahi", radiusMeters: 28000 },
    { name: "Bogra", center: [24.8465, 89.3777], division: "Rajshahi", radiusMeters: 28000 },
    { name: "Pabna", center: [24.0064, 89.2500], division: "Rajshahi", radiusMeters: 25000 },
    { name: "Sirajganj", center: [24.4534, 89.7008], division: "Rajshahi", radiusMeters: 26000 },
    { name: "Natore", center: [24.4102, 88.9834], division: "Rajshahi", radiusMeters: 22000 },
    { name: "Naogaon", center: [24.8103, 88.9414], division: "Rajshahi", radiusMeters: 30000 },
    { name: "Joypurhat", center: [25.1017, 89.0267], division: "Rajshahi", radiusMeters: 18000 },
    { name: "Nawabganj", center: [24.5964, 88.2776], division: "Rajshahi", radiusMeters: 22000 },

    { name: "Khulna", center: [22.8456, 89.5403], division: "Khulna", radiusMeters: 32000 },
    { name: "Jessore", center: [23.1664, 89.2081], division: "Khulna", radiusMeters: 28000 },
    { name: "Kushtia", center: [23.9013, 89.1204], division: "Khulna", radiusMeters: 22000 },
    { name: "Satkhira", center: [22.7185, 89.0705], division: "Khulna", radiusMeters: 30000 },
    { name: "Bagerhat", center: [22.6516, 89.7859], division: "Khulna", radiusMeters: 30000 },
    { name: "Jhenaidah", center: [23.5450, 89.1726], division: "Khulna", radiusMeters: 22000 },
    { name: "Chuadanga", center: [23.6402, 88.8418], division: "Khulna", radiusMeters: 18000 },
    { name: "Magura", center: [23.4873, 89.4199], division: "Khulna", radiusMeters: 18000 },
    { name: "Meherpur", center: [23.7622, 88.6318], division: "Khulna", radiusMeters: 16000 },
    { name: "Narail", center: [23.1725, 89.5126], division: "Khulna", radiusMeters: 18000 },

    { name: "Barisal", center: [22.7010, 90.3535], division: "Barisal", radiusMeters: 28000 },
    { name: "Patuakhali", center: [22.3596, 90.3299], division: "Barisal", radiusMeters: 30000 },
    { name: "Bhola", center: [22.6859, 90.6482], division: "Barisal", radiusMeters: 28000 },
    { name: "Barguna", center: [22.1557, 90.1264], division: "Barisal", radiusMeters: 25000 },
    { name: "Jhalokati", center: [22.6406, 90.1987], division: "Barisal", radiusMeters: 16000 },
    { name: "Pirojpur", center: [22.5841, 89.9720], division: "Barisal", radiusMeters: 20000 },

    { name: "Rangpur", center: [25.7439, 89.2752], division: "Rangpur", radiusMeters: 28000 },
    { name: "Dinajpur", center: [25.6279, 88.6332], division: "Rangpur", radiusMeters: 32000 },
    { name: "Gaibandha", center: [25.3288, 89.5414], division: "Rangpur", radiusMeters: 24000 },
    { name: "Kurigram", center: [25.8058, 89.6361], division: "Rangpur", radiusMeters: 26000 },
    { name: "Lalmonirhat", center: [25.9923, 89.2847], division: "Rangpur", radiusMeters: 22000 },
    { name: "Nilphamari", center: [25.9318, 88.8560], division: "Rangpur", radiusMeters: 22000 },
    { name: "Panchagarh", center: [26.3411, 88.5542], division: "Rangpur", radiusMeters: 22000 },
    { name: "Thakurgaon", center: [26.0337, 88.4617], division: "Rangpur", radiusMeters: 24000 },

    { name: "Mymensingh", center: [24.7471, 90.4203], division: "Mymensingh", radiusMeters: 30000 },
    { name: "Jamalpur", center: [24.9375, 89.9375], division: "Mymensingh", radiusMeters: 26000 },
    { name: "Netrokona", center: [24.8709, 90.7279], division: "Mymensingh", radiusMeters: 28000 },
    { name: "Sherpur", center: [25.0204, 90.0153], division: "Mymensingh", radiusMeters: 20000 }
];

export function getDistrictInfo(districtName) {
    if (!districtName) return null;
    return BANGLADESH_DISTRICTS.find(d => 
        d.name.toLowerCase() === districtName.toLowerCase() ||
        districtName.toLowerCase().includes(d.name.toLowerCase())
    ) || null;
}
