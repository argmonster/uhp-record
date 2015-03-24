
gcc.data.debug = ko.observable(gcc.data.debug);
gcc.data.stat = ko.observable();

   gcc.data.group = _.map(gcc.data.group, function(g) { 
         g.dst = ko.observableArray(_.map(g.dst, function(d) {
               d.isnew = false;
               d.curr = ko.observable(d.val);
               return d;
            }));
         
         g.addable = ko.observable(g.addable);
         g.updateable = ko.observable(g.updateable);
         g.readable = ko.observable(g.readable);
         g.dataidx = ko.observable(0);
         g.isnew = ko.observable(false);
         g.alldata = [];
         g.alldata.push(g.dst()); //_.map(g.dst, function(d) { return d.val; }));

         g.isvisible = ko.computed(function() {
            return g.dataidx() > 0
            });

         g.setcurr = ko.computed(function() {
            if (!g.alldata[g.dataidx()]) {
               var data = getpreviousdata(g);
               g.alldata.push(data);
               g.dataidx(g.alldata.length - 1);
            }
            g.dst( g.alldata[g.dataidx()]);

         });

         g.pendingupdate = ko.observable(false);
         g.pendingadd = ko.observable(false);

         g.changed = ko.computed(function() {
            g.pendingupdate(!(_.every(g.dst(), function(d) {
               return d.curr() === d.val;
            })) && !g.pendingadd());
         });
         g.added = ko.computed(function() {
            g.pendingadd(_.every(g.dst(), function(d) {
               return d.val === '';
            }));
         });

         g.hasnext = ko.computed(function() {
            return g.dataidx() > 0;
            });

         g.hasprev = ko.computed(function() {
            return g.readable();
         });

         g.canadd = ko.computed(function() {
            return g.dataidx() === 0 && 
               !g.pendingadd() &&
               g.addable();
         });

         g.canupdate = ko.computed(function() {
            return g.updateable() ||
               (g.addable() && g.pendingadd());
         });
         return g;
      });

   var mapObjKeyToJson = function(obj, key) {
      return JSON.stringify( _.map(obj, function(o) { return o[key]; }));
   };

   var getpreviousdata = function(dst) {
      var c = '|C|getnextrec|' + 
         dst.lib + '|' + 
         mapObjKeyToJson(dst.dst(), 'name');

      rc = top.topFrame.BUIControl.callMIS(c, '');
      gcc.data.stat(rc);
      var data = _.map(JSON.parse(rc.split('|')[2]), 
         function(d, i) { 
            return {
               name: dst.dst()[i].name, 
               label: dst.dst()[i].label, 
               val: d,
               curr: ko.observable(d)
            };
         }
      );
      return data;
   };

   var updatedata = function(dst) {
      var c = '|C|update|' + dst.lib + '|' + 
         mapObjKeyToJson(dst.dst(), 'name') + '|' +
         mapObjKeyToJson(dst.dst(), 'val') + '|' +
         mapObjKeyToJson(_.map(dst.dst(), 
            function(d) { 
               d.newval = d.curr(); 
               return d; 
            }), 
         'newval');
      rc = top.topFrame.BUIControl.callMIS(c, '');
      gcc.data.stat(rc);
      console.log(rc);
      var data = rc.split('|')[2];
   };

   var savedata = function(dst) {
      var c = '|C|save|' + dst.lib + '|' + 
         mapObjKeyToJson(dst.dst(), 'name') + '|' +
         mapObjKeyToJson(_.map(dst.dst(),
            function(d) {
               d.newval = d.curr();
               return d;
            }),
         'newval');
      rc = top.topFrame.BUIControl.callMIS(c, '');
      gcc.data.stat(rc);
      var data = rc.split('|')[2];
   };

   gcc.data.next = function(dstgroup) {
      dstgroup.dataidx(dstgroup.dataidx() - 1);
   };

   gcc.data.prev = function(dstgroup) {
      dstgroup.dataidx(dstgroup.dataidx() + 1);
   };

   gcc.data.add = function(dstgroup) { 
      var c = _.map(dstgroup.dst(), function(d) {
            //d.val = '';
            //d.curr('');
            //return d;
            return {
               val: '',
               curr: ko.observable(''),
               name: d.name,
               label: d.label
            };

         });
      dstgroup.alldata.unshift(c);
      dstgroup.dataidx(1);
      dstgroup.dataidx(0);
      dstgroup.pendingadd(true);
   };
      
   gcc.data.update = function(dstgroup) {
      updatedata(dstgroup);
      _.forEach(dstgroup.dst(), function(d) {
         d.val = d.curr();
         });
      dstgroup.pendingupdate(false);
      //dstgroup.val = dstgroup.curr();
   };

   gcc.data.save = function(dstgroup) {
      savedata(dstgroup);
      var curr = dstgroup.dst();
      _.forEach(curr, function(item) {
         item.val = item.curr();
      });
      dstgroup.alldata = [curr];
      dstgroup.pendingadd(false);
      dstgroup.dataidx(0);
   };
   
   ko.applyBindings(gcc.data);
