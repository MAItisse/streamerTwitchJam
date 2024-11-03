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

}

