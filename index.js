/* jshint esversion:6 */

var util = require('util');
var stream = require('stream');

var File = require('vinyl');

module.exports = function (declaration, definition) {
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
        cont = this.push(this.output[0]);
        this.output = this.output[1];
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
        path: definition,
        contents: createResourceDefinition(resource)
      }));
      this.addToOutput(new File({
        path: declaration,
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
`System.register([], function(exports) {
  var resource = ${JSON.stringify(resource)};
  return {
    setters: [],
    execute: function () {
      exports('resource', resource);
    }
  };
});
`);
  }
  function createResourceDeclaration(resource) {
    var s = new stream.PassThrough();
    s.write('export const resource : ');
    var dumpSchema = (s, obj) => {
      if (typeof obj === 'object') {
        s.write('{ ');
        Object.keys(obj).forEach(key => {
          s.write(key);
          s.write(' : ');
          dumpSchema(s, obj[key]);
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
