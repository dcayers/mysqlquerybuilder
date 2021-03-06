/*jslint node: true*/
/*eslint-disable no-console, no-alert, no-unused-vars*/
/*global module, console*/
/*
var query_params = {
    type: "string: select, insert, update, delete",
    database: "optional. for dotNotation param...",
    table: "string: name of table to query",
    values: "string or object: * or values_object",
    where: "string, where condition",
    join: "object: join parameters - join_object",
    order: "string: order by this column",
    index: "string: specific index to use",
    pagination: {
        page: "int",
        limit: "int"
    },
    options: {
        useDotNotation: "boolean: defaults to false",
        forceIndex: "boolean: defaults to false",
        orderByDir: "string: order by direction"
    }
};

var values_object = {
    column_name: "column_value"
};

var join_object = {
    type: "string: join type. inner, outer, etc...",
    table: "join_table",
    condition: "string: join condition"
};
*/


(function () {
    'use strict';
    var escape = require('sqlstring').escape;
    
    function assign_defaults(object,options) {
        const defaults = {
            options: {
                useDotNotation: false,
                forceIndex: false,
                orderByDir: "ASC"
            }
        };
        
        var queryObject = Object.assign({}, object, defaults);
        
        if(options) {
//            console.log(options)
            var mergedOptions = Object.assign({},defaults['options'],options);
//            console.log(mergedOptions);
            queryObject['options'] = mergedOptions;
        }
        
        return queryObject;
    }
    
    function check_errors(object) {
        var p_string = 'value', p_array = [], p_bool = true, p_number = 3;
        var props = {
            type: {required: p_string},
            table: {required: p_string},
            values: {required: {type1: p_string, type2: p_array}},
            database: p_string,
            where: p_string,
            join: p_array,
            order: p_string,
            index: p_string,
            pagination: {
                page: p_number,
                limit: p_number
            },
            options: {
                useDotNotation: p_bool,
                forceIndex: p_bool,
                orderByDir: p_string
            }
        }, err = 'no errors';
        
        for (var key in props) {
            if(props[key].required && object[key] == undefined) {
                err = `Error: ${key} is required but undefined.`;
                return err;  
            }

            if(props[key].required) {
                if (Object.prototype.toString.call(props[key].required) === '[object Object]') {
                    if(key === 'values') {
                        if(Object.prototype.toString.call(object[key]) !== '[object String]' && Object.prototype.toString.call(object[key]) !== '[object Array]') {
                            err =  `Error: expected '${Object.prototype.toString.call(props[key].required.type1)}' or '${Object.prototype.toString.call(props[key].required.type2)}' but found '${Object.prototype.toString.call(object[key])}' at key '${key}'`;
                        } else if ((Object.prototype.toString.call(object[key]) == '[object String]' || Object.prototype.toString.call(object[key]) == '[object Array]') && object[key].length === 0) {
                            err = `Error: expected '${Object.prototype.toString.call(props[key].required.type1)}' or '${Object.prototype.toString.call(props[key].required.type2)}' but found empty '${Object.prototype.toString.call(object[key])}' at key '${key}'`;
                        }
                    }
                } else {
                    if(Object.prototype.toString.call(props[key].required) !== Object.prototype.toString.call(object[key]) ){
                        err = `Error: expected '${Object.prototype.toString.call(props[key].required)}' but found '${Object.prototype.toString.call(object[key])}' at key '${key}'`;
                    } else if(object[key].length === 0) {
                        err = `Error: expected '${Object.prototype.toString.call(props[key].required)}' but found empty '${Object.prototype.toString.call(object[key])}' at key '${key}'`;
                    }
                } 
            } else {
                if(object[key] != undefined) {
                    if (Object.prototype.toString.call(props[key]) === '[object Object]') {
                        for(var subkey in props[key]) {
                            if(Object.prototype.toString.call(props[key][subkey]) !== Object.prototype.toString.call(object[key][subkey])) {
                                err = `Error: expected '${Object.prototype.toString.call(props[key][subkey])}' but found '${Object.prototype.toString.call(object[key][subkey])}' at key '${key}.${subkey}'`;
                            }
                        }
                    } else {
                        if(Object.prototype.toString.call(props[key]) !== Object.prototype.toString.call(object[key]) ){
                            err = `Error: expected '${Object.prototype.toString.call(props[key])}' but found '${Object.prototype.toString.call(object[key])}' at key '${key}'`;
                        } else if(object[key].length === 0) {
                            err = `Error: expected '${Object.prototype.toString.call(props[key])}' but found empty '${Object.prototype.toString.call(object[key])}' at key '${key}'`;
                        }
                    } 
                } 
            }
        }
        
        return err;
    }
    
    function construct_query_values(type, object) {
        var return_values = '',insert_columns = '', insert_values = '', update_values = '';
        if(object === '*') {
            return object
        } else {
            //take data and turn into either '
            
            if(Object.prototype.toString.call(object) === '[object Array]') {
                for (var i = 0, len = object.length; i < len; ++i) {
                    var column_name = Object.keys(object[i]);
                    if (type === 'insert') {
                        
                        if ((i+1) === len) {
                            insert_columns += column_name;
                            insert_values += escape(object[i][column_name],null,'local');
                        } else {
                            insert_columns += `${column_name},`;
                            insert_values += `${escape(object[i][column_name],null,'local')},`;
                        }
                    } else if (type === 'update') {
                        if ((i+1) === len) {
                            update_values += `${column_name} = ${escape(object[i][column_name],null,'local')}`;
                        } else {
                            update_values += `${column_name} = ${escape(object[i][column_name],null,'local')},`;
                        }
                    }
                }

                return_values = (type==='insert') ?
                ({
                    columns: insert_columns,
                    values: insert_values
                })
                :
                update_values
            }
        }
        
        return return_values;
    }
    
    function build_query(object,opt) {
        var query_object = assign_defaults(object,opt);
        var query_string = 'this is a query_string...';
        var errors = check_errors(query_object);
        if(errors === 'no errors') {
            if(query_object.type.toLowerCase() === 'select') {
                query_string = `Select ${query_object.values} from ${query_object.table}${(query_object.join)?` ${query_object.join}`:''}${(query_object.where)? ` where ${query_object.where}`: ''}${(query_object.order)?` order by ${query_object.order} ${query_object.options.orderByDir}`:''}${(query_object.pagination)?` limit ${query_object.pagination.page},${query_object.pagination.limit}`:''};`;
            } else if (query_object.type.toLowerCase() === 'delete') {
                query_string = `Delete from ${query_object.table}${(query_object.where)? ` where ${query_object.where}`: ''};`;
            } else if(query_object.type.toLowerCase() === 'insert') {
                var insert_values = construct_query_values('insert',query_object.values);
                query_string = `Insert into ${query_object.table} (${insert_values.columns}) values(${insert_values.values});`
            } else if(query_object.type.toLowerCase() === 'update') {
                var update_values = construct_query_values('update',query_object.values);
                query_string = `Update ${query_object.table} Set ${update_values}${(query_object.where)? ` where ${query_object.where}`: ''};`;
            }
            console.log(query_string)
            return query_string;
        } else {
            return errors;
        } 
    }
    
    function build_query_static(options,object) {
        return build_query(object, options);
    }

    function bind_and_build(options) {
        this.options = options;
        return build_query_static.bind(this,options)
    }
    
    module.exports = {
        staticBuild: bind_and_build,
        build:build_query,
        defaults: assign_defaults,
        check: check_errors
    };
}());


