/* jshint esversion:6 */

var path = require('path');
var stream = require('stream');
var util = require('util');

var File = require('vinyl');
var through2 = require('through2');

module.exports = {};

var getModuleName = (prefix, file) => {
  return prefix + file.basename.replace(/[^a-zA-Z0-9_]/g, '_');
};

module.exports.declaration = function (prefix) {
  if (typeof prefix === 'undefined') {
    prefix = 'resource_';
  }

  return through2.obj(function (file, enc, callback) {
    file = new File(file);
    var moduleName = getModuleName(prefix, file);
    file.basename = moduleName + '.d.ts';
    file.contents = new Buffer(
`
export declare const ${moduleName} : string;
`
    );
    this.push(file);
    callback();
  });
};

module.exports.definition = function (prefix) {
  if (typeof prefix === 'undefined') {
    prefix = 'resource_';
  }

  return through2.obj(function (file, enc, callback) {
    file = new File(file);
    var moduleName = getModuleName(prefix, file);
    var contents = new Buffer(
`System.register([], function (exports, context) {
  var ${moduleName} = '${
    file.contents.toString()
    .replace(/[\\"']/g, '\\$&')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\u0000/g, '\\0')
  }';
  return {
    setters: [],
    execute: function () {
      exports('${moduleName}', ${moduleName});
    }
  };
});
`
    );
    file.stem = moduleName;
    file.extname = '.js';
    file.contents = contents;
    this.push(file);
    callback();
  });
};

module.exports.pack = function (declaration, definition) {
  var ResouceStream = function () {
    var _this = this;
    this.input = [];
    this.output = [];
    this.outputTail = this.output;
    this.outputBlocking = false;
    this.addToOutput = function (element) {
      var newTail = [];
      this.outputTail.push(element);
      this.outputTail.push(newTail);
      this.outputTail = newTail;
    };
    this.flushOutput = function () {
      if (this.outputBlocking) {
        return;
      }
      var cont = true;
      while (cont && this.output.length) {
        var element = this.output[0];
        this.output = this.output[1];
        cont = this.push(element);
      }
      this.outputBlocking = !cont;
    };
    stream.Duplex.call(this, {
      readableObjectMode: true,
      writableObjectMode: true,
      read: (size) => {
        this.outputBlocking = false;
        this.flushOutput();
      },
      write: (chunk, encoding, callback) => {
        this.input.push(chunk);
        callback();
      }
    });
    this.on('finish', () => {
      var resource = {};
      this.input.forEach(file => {
        var cur = resource;
        var comps = file.relative.split(/[\/\\]+/g)
        .map(comp => comp.replace(/[^a-zA-Z0-9_]/, '_'));
        comps.slice(0, -1).forEach(dir => {
          if (!cur[dir]) {
            cur[dir] = {};
          }
          cur = cur[dir];
        });
        comps.slice(-1).forEach(name => {
          cur[name] = file.contents.toString();
        });
      });
      this.addToOutput(new File({
        path: path.resolve(definition),
        contents: createResourceDefinition(resource)
      }));
      this.addToOutput(new File({
        path: path.resolve(declaration),
        contents: createResourceDeclaration(resource)
      }));
      this.addToOutput(null);
      this.flushOutput();
    });
  };

  util.inherits(ResouceStream, stream.Duplex);
  return new ResouceStream();

  function createResourceDefinition (resource) {
    return new Buffer(
`System.register([], function(exports, context) {
  var RESOURCE = ${JSON.stringify(resource)};
  return {
    setters: [],
    execute: function () {
      exports('RESOURCE', RESOURCE);
    }
  };
});
`);
  }
  function createResourceDeclaration(resource) {
    var s = new stream.PassThrough();
    s.write('export declare const RESOURCE : ');
    var dumpSchema = (s, obj) => {
      if (typeof obj === 'object') {
        s.write('{ ');
        Object.keys(obj).forEach(key => {
          s.write(key);
          s.write(' : ');
          dumpSchema(s, obj[key]);
          s.write('; ');
        });
        s.write(' }');
      } else {
        s.write(typeof obj);
      }
    };
    dumpSchema(s, resource);
    s.write(';\n');
    s.end();
    return s;
  }
};
