export namespace config {
	
	export class GetVideoSettingsResponse {
	    baseHeight?: number;
	    baseWidth?: number;
	    fpsDenominator?: number;
	    fpsNumerator?: number;
	    outputHeight?: number;
	    outputWidth?: number;
	
	    static createFrom(source: any = {}) {
	        return new GetVideoSettingsResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.baseHeight = source["baseHeight"];
	        this.baseWidth = source["baseWidth"];
	        this.fpsDenominator = source["fpsDenominator"];
	        this.fpsNumerator = source["fpsNumerator"];
	        this.outputHeight = source["outputHeight"];
	        this.outputWidth = source["outputWidth"];
	    }
	}

}

export namespace types {
	
	export class Bound {
	    left: number;
	    top: number;
	    right: number;
	    bottom: number;
	
	    static createFrom(source: any = {}) {
	        return new Bound(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.left = source["left"];
	        this.top = source["top"];
	        this.right = source["right"];
	        this.bottom = source["bottom"];
	    }
	}
	export class Info {
	    title: string;
	    description: string;
	
	    static createFrom(source: any = {}) {
	        return new Info(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.title = source["title"];
	        this.description = source["description"];
	    }
	}
	export class InfoWindowData {
	    infoWindow: {[key: string]: Info};
	
	    static createFrom(source: any = {}) {
	        return new InfoWindowData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.infoWindow = this.convertValues(source["infoWindow"], Info, true);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class SecretPy {
	    Username: string;
	    Password: string;
	
	    static createFrom(source: any = {}) {
	        return new SecretPy(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Username = source["Username"];
	        this.Password = source["Password"];
	    }
	}
	export class StatusMessage {
	    Status: string;
	    Message: string;
	    Data?: any;
	
	    static createFrom(source: any = {}) {
	        return new StatusMessage(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Status = source["Status"];
	        this.Message = source["Message"];
	        this.Data = source["Data"];
	    }
	}
	export class WindowConfig {
	    bounds: {[key: string]: Bound};
	
	    static createFrom(source: any = {}) {
	        return new WindowConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.bounds = this.convertValues(source["bounds"], Bound, true);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

