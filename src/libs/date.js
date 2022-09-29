class DateUtil {

    // date = new Date( Date.now() )
    //===========Getters & Setters ============
    getDate = () => {
        return this.date
    }
    setDate = ( date ) => {
        this.date = date
        return this
    }

    getDateString = () => {
        const YMD = this.date.toLocaleDateString( 'eu-ES', { hour12 : false } ).replace( /\//g, '-' ).split( '-' )
        return String( YMD[0] ) + '-' + String( YMD[1] ).padStart( 2, '00' ) + '-' + String( YMD[2] ).padStart( 2, '00' )
    }

    getTimeString = ( options = false ) => {
        return this.date.toLocaleTimeString( 'eu-ES', { hour12 : false } ) + ( options?.ms ? '.' + String( this.date.getMilliseconds() ).padStart( 3, '000' ) : '' )
    }

    getTimeStringFull = () => {
        return `${String( this.date.getHours() ).padStart( 2, '00' )}:${String( this.date.getMinutes() ).padStart( 2, '00' )}:${String( this.date.getSeconds() ).padStart( 2, '00' )}.${String(
            this.date.getMilliseconds()
        ).padStart( 3, '000' )}`
    }

    getDateTimeString = ( options = false ) => {
        return this.getDateString() + ' ' + this.getTimeString( options )
    }

    getDateTimeFullString = () => {
        return this.getDateString() + ' ' + this.getTimeStringFull()
    }

    subDays = ( sub = 1 ) => {
        this.date.setDate( this.date.getDate() - sub )
        return this
    }

    addDays = ( add = 1 ) => {
        this.date.setDate( this.date.getDate() + add )
        return this
    }

    endOfDay = () => {
        this.date.setHours( 23, 59, 59, 999 )
        return this
    }

    startOfDay = () => {
        this.date.setHours( 0, 0, 0, 0 )
        return this
    }

    yesterday = this.subDays()
    tomorrow = this.addDays()
}

module.exports = DateUtil
