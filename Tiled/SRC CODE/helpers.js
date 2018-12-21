export const getProperty = (properties, propertyName) => {
    if (!properties) {
        return null
    }
    const property = properties.find((prop) => prop.name === propertyName)
    return property ? property.value : null
}