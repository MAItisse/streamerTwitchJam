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

}

