// program.js - program routines for gnunet-web services
// Copyright (C) 2014  David Barksdale <amatus@amatus.name>
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
  GNUNET_PROGRAM_run__deps: ['GNUNET_log_setup'],
  GNUNET_PROGRAM_run: function(argc, argv, binaryName, binaryHelp, options,
                               task, task_cls) {
    ccall('GNUNET_log_setup', 'void',
      ['number', 'string', 'number'],
      [binaryName, 'DEBUG', 0]);
    var cfgfile = 0; // const char *
    var cfg = 1; // opaque non-null pointer
    Runtime.dynCall('viiii', task, [task_cls, argv, cfgfile, cfg]);
    throw 'SimulateInfiniteLoop';
  }
});

// vim: set expandtab ts=2 sw=2:
