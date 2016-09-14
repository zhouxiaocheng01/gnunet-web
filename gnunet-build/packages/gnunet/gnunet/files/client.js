// client.js - client routines for gnunet-web services
// Copyright (C) 2013,2014  David Barksdale <amatus@amatus.name>
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

mergeInto(LibraryManager.library, {
  $CLIENT_PORTS: {},
  $NEXT_PORT: 1,
  GNUNET_CLIENT_connect__deps: ['$CLIENT_PORTS', '$NEXT_PORT'],
  GNUNET_CLIENT_connect: function(service_name, cfg) {
    var service_name = Pointer_stringify(service_name);
    var channel;
    try {
      channel = new MessageChannel();
    } catch (e) {
      console.error("No MessageChannel in this browser", e);
      return 0;
    }
    var port = NEXT_PORT;
    NEXT_PORT = port + 1;
    var client = {
      port: channel.port1,
      name: service_name,
      queue: [],
      handler: null,
      th: null};
    client.port.onmessage = function(ev) {
      try {
        if (client.handler) {
          var handler = client.handler;
          client.handler = null;
          handler(ev);
        } else
          client.queue.push(ev);
      } catch (e) {
        console.error("Rekt'd", e);
      }
    };
    CLIENT_PORTS[port] = client;
    console.debug('connecting to service', service_name);
    if (typeof client_connect == 'function') {
      client_connect(service_name, channel.port2);
    } else {
      try {
        gnunet_web.service.client_connect(service_name, 'client.js',
            channel.port2);
      } catch(e) {
        console.error('Failed to connect to', service_name, e);
        return 0;
      }
    }
    return port;
  },
  GNUNET_CLIENT_connecT__deps: ['GNUNET_CLIENT_connect'],
  GNUNET_CLIENT_connecT: function(cfg, service_name, handlers, error_handler,
      error_handler_cls) {
    c = _GNUNET_CLIENT_connect(service_name, cfg);
    if (0 == c)
      return 0;
    return _GNUNET_MQ_queue_for_connection_client(c, handlers, error_handler,
        error_handler_cls);
  },
  GNUNET_CLIENT_disconnect__deps: ['$CLIENT_PORTS'],
  GNUNET_CLIENT_disconnect: function(port) {
    var client = CLIENT_PORTS[port];
    console.debug('Closing client port to service', client.name);
    clearTimeout(client.th);
    client.th = null;
    client.port.close();
    delete CLIENT_PORTS[port];
  },
  GNUNET_CLIENT_receive__deps: ['$CLIENT_PORTS'],
  GNUNET_CLIENT_receive: function(port, handler, handler_cls, timeout) {
    var client = CLIENT_PORTS[port];
    var fn = function(ev) {
      console.debug('Received ' + ev.data.length + ' bytes from service '
        + client.name);
      ccallFunc(Runtime.getFuncWrapper(handler, 'vii'), 'void',
        ['number', 'array'],
        [handler_cls, ev.data]);
    };
    if (client.queue.length) {
      var ev = client.queue[0];
      setTimeout(function() { fn(ev); }, 0);
      client.queue = client.queue.slice(1);
    } else {
      client.handler = fn;
      var delay = getValue(timeout, 'i64');
      if (-1 != delay) {
        setTimeout(function() {
          client.handler = null;
          Runtime.dynCall('vii', handler, [handler_cls, 0]);
        }, delay / 1000);
      }
    }
  },
  GNUNET_CLIENT_notify_transmit_ready__deps: ['$CLIENT_PORTS'],
  GNUNET_CLIENT_notify_transmit_ready: function(port, size, timeout,
                                           auto_retry, notify, notify_cls) {
    var client = CLIENT_PORTS[port];
    // Supposedly we can call notify right now, but the current code never
    // does so let's emulate that.
    client.th = setTimeout(function() {
      client.th = null;
      console.debug('I want to send ' + size + ' bytes to service '
        + client.name);
      var stack = Runtime.stackSave();
      var buffer = Runtime.stackAlloc(size);
      var ret = Runtime.dynCall('iiii', notify, [notify_cls, size, buffer]);
      console.debug('I\'m sending ' + ret + ' bytes to service '
        + client.name);
      var view = {{{ makeHEAPView('U8', 'buffer', 'buffer+ret') }}};
      // See http://code.google.com/p/chromium/issues/detail?id=169705
      if (ret > 0) {
        try {
          client.port.postMessage(new Uint8Array(view));
        } catch (e) {
          console.error('Failed to send');
        }
      }
      Runtime.stackRestore(stack);
    }, 0);
    return port;
  },
  GNUNET_CLIENT_notify_transmit_ready_cancel_deps: ['$CLIENT_PORTS'],
  GNUNET_CLIENT_notify_transmit_ready_cancel: function(port) {
    var client = CLIENT_PORTS[port];
    clearTimeout(client.th);
    client.th = null;
  },
});

// vim: set expandtab ts=2 sw=2:
