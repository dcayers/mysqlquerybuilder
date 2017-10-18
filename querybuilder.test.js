var qb = require('./querybuilder')
var sbuild = require('./querybuilder').staticBuild;

var staticBuild = new sbuild({
    useDotNotation: true,
    forceIndex: false,
    orderByDir: "ASC"
})

var build = qb.build;

var queryObject = {},expectedObject;
var defaults = {
    options: {
        useDotNotation: false,
        forceIndex: false,
        orderByDir: "ASC"
    }
};

describe('assign defaults', () => {
    test('to empty object', () => {
        
        expect(qb.defaults(queryObject)).toEqual(defaults);
    });
    
    test('to object with values', () => {
        queryObject = {
            type: "select"
        };
        
        expectedObject = {
            type:"select", 
            options: {
                useDotNotation: false,
                forceIndex: false,
                orderByDir: "ASC"
            }
        };
        
        expect(qb.defaults(queryObject)).toEqual(expectedObject);
    });
    
    test('object with values and options', () => {
        queryObject = {
            type: "insert",
        };
        
        defaults.options.forceIndex = true;
        expectedObject = Object.assign({},queryObject,defaults);
        
        expect(qb.defaults(queryObject, {forceIndex: true})).toEqual(expectedObject);
    });
});


describe('checks for errors in object', () => {
    test('with missing required fields', () => {
         {};
        expect(qb.check({})).toEqual('Error: type is required but undefined.');
    });
    
    test('with required field that has wrong datatype', () => {
        var params1 = {
            type: 12,
            table: 'newtable',
            values: '*'
        };
        
        expect(qb.check(params1)).toEqual('Error: expected \'[object String]\' but found \'[object Number]\' at key \'type\'');
    });
    
    test('with required field that has variant datatype and does not match', () => {
        var params2 = {
            type: 'insert',
            table: 'newtable',
            values: {}
        }
        
        expect(qb.check(params2)).toEqual('Error: expected \'[object String]\' or \'[object Array]\' but found \'[object Object]\' at key \'values\'');
    });
    
    test('with required field that has right datatype but empty value', () => {
        var params3 = {
            type: 'insert',
            table: '',
            values: '*'
        }
        
        expect(qb.check(params3)).toEqual('Error: expected \'[object String]\' but found empty \'[object String]\' at key \'table\'')
    });
    
    test('with required field that has variant datatype, does match options, but empty value', () => {
        var params4 = {
            type: 'insert',
            table: 'newtable',
            values: []
        }

        expect(qb.check(params4)).toEqual('Error: expected \'[object String]\' or \'[object Array]\' but found empty \'[object Array]\' at key \'values\'');
    });
    
    test('with optional field that has wrong datatype', () => {
        var params5 = {
            type: 'insert',
            table: 'newtable',
            values: '*',
            database: 0
        }

        expect(qb.check(params5)).toEqual('Error: expected \'[object String]\' but found \'[object Number]\' at key \'database\'');
    });
    
    test('with optional field that has wrong datatype at nested level', () => {
        var params6 = {
            type: 'insert',
            table: 'newtable',
            values: '*',
            database: 0,
            pagination: {
                page: "1",
                limit: 50
            }
        }

        expect(qb.check(params6)).toEqual('Error: expected \'[object Number]\' but found \'[object String]\' at key \'pagination.page\'');
    });
});


describe('test building', () => {
    test('select with most params and no errors', () => {
        var params7 = {
            database: 'gatsbyezypo',
            type: 'select',
            table: 'GLMSCAN',
            values: '*',
            where: 'glms_tran = 1',
            pagination: {
                page: 1,
                limit: 50
            }
        }

        expect(build(params7)).toEqual('Select * from GLMSCAN where glms_tran = 1 limit 1,50;')
    });
    
    test('delete with params and no errors', () => {
        var params8 = {
            database: 'gatsbyezypo',
            type: 'delete',
            table: 'GLMSCAN',
            values: 'nil',
            where: 'glms_tran = 1'
        }
        
        expect(build(params8)).toEqual('Delete from GLMSCAN where glms_tran = 1;');
    }); 
    
    test('insert with params and no errors, values as array of objects', () => {
        var params9 = {
            database: 'gatsbyezypo',
            type: 'insert',
            table: 'GLMSCAN',
            values: [{GLMS_Document:'document'},{GLMS_MimeType:'application/pdf'}]
        }

        expect(build(params9,{useDotNotation:false})).toEqual('Insert into GLMSCAN (GLMS_Document,GLMS_MimeType) values(\'document\',\'application/pdf\');');
    });
    
    test('update with params and no errors, values as array of objects. using staticBuild', () => {
        var params10 = {
            database: 'gatsbyezypo',
            type: 'update',
            table: 'GLMSCAN',
            values: [{GLMS_Document:'document'},{GLMS_MimeType:'application/pdf'}],
            where: 'glms_tran = 1'
        }
        
        expect(staticBuild(params10)).toEqual('Update GLMSCAN Set GLMS_Document = \'document\',GLMS_MimeType = \'application/pdf\' where glms_tran = 1;')
    })
});


