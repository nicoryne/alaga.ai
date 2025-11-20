// Philippines Geographic Data
// Source: barangay_extended.json - Official PSGC hierarchical data
// Structure: Region -> Province -> Municipality/City -> Barangay

import extendedData from './barangay_extended.json'

export type RegionName = string
export type ProvinceName = string
export type MunicipalityName = string
export type BarangayName = string

interface GeographicComponent {
  name: string
  type: 'region' | 'province' | 'city' | 'municipality' | 'barangay'
  psgc_id: string
  parent_psgc_id: string
  nicknames: string | null
  components: GeographicComponent[]
}

// Build lookup maps for efficient access
const buildLookupMaps = () => {
  const regionsMap = new Map<RegionName, Map<ProvinceName, Map<MunicipalityName, BarangayName[]>>>()
  
  const processData = (components: GeographicComponent[]) => {
    for (const region of components) {
      if (region.type !== 'region') continue
      
      const provincesMap = new Map<ProvinceName, Map<MunicipalityName, BarangayName[]>>()
      
      // Check if region has provinces or cities directly (like NCR)
      const hasProvinces = region.components.some((comp) => comp.type === 'province')
      
      if (hasProvinces) {
        // Normal case: Region -> Province -> Municipality/City -> Barangay
        // Also handle independent cities at region level (like "City of Cebu")
        
        // First, collect all provinces and independent cities
        const provinces: GeographicComponent[] = []
        const independentCities: GeographicComponent[] = []
        
        for (const comp of region.components) {
          if (comp.type === 'province') {
            provinces.push(comp)
          } else if (comp.type === 'city' && comp.parent_psgc_id === region.psgc_id) {
            independentCities.push(comp)
          }
        }
        
        // Process each province
        for (const province of provinces) {
          const municipalitiesMap = new Map<MunicipalityName, BarangayName[]>()
          
          // Add municipalities/cities under the province
          for (const municipality of province.components) {
            if (municipality.type !== 'municipality' && municipality.type !== 'city') continue
            
            const barangays: BarangayName[] = []
            for (const barangay of municipality.components) {
              if (barangay.type === 'barangay') {
                barangays.push(barangay.name)
              }
            }
            
            if (barangays.length > 0) {
              municipalitiesMap.set(municipality.name, barangays.sort())
            }
          }
          
          // Match independent cities to this province by name
          // e.g., "City of Cebu" matches "Cebu" province
          for (const city of independentCities) {
            const cityName = city.name.toLowerCase()
            const provinceName = province.name.toLowerCase()
            
            // Check if city name contains province name or vice versa
            if (
              cityName.includes(provinceName) ||
              cityName.replace(/^(city of|city)\s+/i, '').trim() === provinceName ||
              cityName.replace(/\s+city$/i, '').trim() === provinceName
            ) {
              const barangays: BarangayName[] = []
              for (const barangay of city.components) {
                if (barangay.type === 'barangay') {
                  barangays.push(barangay.name)
                }
              }
              if (barangays.length > 0) {
                municipalitiesMap.set(city.name, barangays.sort())
              }
            }
          }
          
          if (municipalitiesMap.size > 0) {
            provincesMap.set(province.name, municipalitiesMap)
          }
        }
      } else {
        // Special case: Region -> City -> Barangay (like NCR)
        // Create a virtual province entry with all cities as municipalities
        const virtualProvinceName = region.name.includes('NCR') 
          ? 'Metro Manila' 
          : region.name
        const municipalitiesMap = new Map<MunicipalityName, BarangayName[]>()
        
        for (const city of region.components) {
          if (city.type !== 'city' && city.type !== 'municipality') continue
          
          const barangays: BarangayName[] = []
          for (const barangay of city.components) {
            if (barangay.type === 'barangay') {
              barangays.push(barangay.name)
            }
          }
          
          if (barangays.length > 0) {
            municipalitiesMap.set(city.name, barangays.sort())
          }
        }
        
        if (municipalitiesMap.size > 0) {
          provincesMap.set(virtualProvinceName, municipalitiesMap)
        }
      }
      
      if (provincesMap.size > 0) {
        regionsMap.set(region.name, provincesMap)
      }
    }
  }
  
  const data = extendedData as { components: GeographicComponent[] }
  processData(data.components)
  
  return regionsMap
}

const regionsMap = buildLookupMaps()

// Helper functions
export const getRegions = (): RegionName[] => {
  return Array.from(regionsMap.keys()).sort()
}

export const getProvincesByRegion = (regionName: RegionName): ProvinceName[] => {
  const region = regionsMap.get(regionName)
  if (!region) return []
  return Array.from(region.keys()).sort()
}

export const getMunicipalitiesByProvince = (
  regionName: RegionName,
  provinceName: ProvinceName,
): MunicipalityName[] => {
  const region = regionsMap.get(regionName)
  if (!region) return []
  const province = region.get(provinceName)
  if (!province) return []
  return Array.from(province.keys()).sort()
}

export const getBarangaysByMunicipality = (
  regionName: RegionName,
  provinceName: ProvinceName,
  municipalityName: MunicipalityName,
): BarangayName[] => {
  const region = regionsMap.get(regionName)
  if (!region) return []
  const province = region.get(provinceName)
  if (!province) return []
  const municipality = province.get(municipalityName)
  if (!municipality) return []
  return municipality
}
