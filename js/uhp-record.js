ko.bindingHandlers.datepicker = {
   update: function(element, valueAccessor, allBindings) {
      $(element).datepicker({
          beforeShow: function (input, inst) {
             var formoff = $('form').offset();
             var offset = $(input).offset();
             var height = $(input).height();
             window.setTimeout(function () {
                inst.dpDiv.css({ 
                   top: (17 + (-1 * formoff.top) + offset.top + height + 4) + 'px', 
                   left: offset.left + 'px' })
             }, 1);

          }
      });
   }
};

gcc.data.debug = ko.observable(gcc.data.debug);
gcc.data.stat = ko.observable();

   gcc.data.group = _.map(gcc.data.group, function(g) { 
         
         g.addable = ko.observable(g.addable);
         g.updateable = ko.observable(g.updateable);
         g.readable = ko.observable(g.readable);
         g.dataidx = ko.observable(0);
         g.isnew = ko.observable(false);

         g.isvisible = ko.computed(function() {
            return g.dataidx() > 0
            });

         g.pendingupdate = ko.observable(false);
         g.pendingadd = ko.observable(false);

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
         g.dst = ko.observableArray(_.map(g.dst, function(d) {
               d.isnew = false;
               d.curr = ko.observable(d.val);

               var opt = {};
               if (d.option) {
                  gcc.data.stat(d.option);
                  try {
                     opt = JSON.parse(d.option);
                  } catch(err) { 
                     gcc.data.stat(err);
                  }
               }
               d.type = opt.type;
               d.options = opt.options;
               d.isselect = d.type === 'select' && g.canupdate();
               d.isdate = d.type === 'date' && g.canupdate();
               d.istext = ((d.type === 'text' || !d.type) && g.canupdate());
               return d;
            }));

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

         g.alldata = [];
         g.alldata.push(g.dst()); //_.map(g.dst, function(d) { return d.val; }));
         g.setcurr = ko.computed(function() {
            if (!g.alldata[g.dataidx()]) {
               var data = getpreviousdata(g);
               g.alldata.push(data);
               g.dataidx(g.alldata.length - 1);
            }
            g.dst( g.alldata[g.dataidx()]);

         });

         return g;
      });

   var mapObjKeyToJson = function(obj, key) {
      return JSON.stringify( _.map(obj, function(o) { return o[key] || ''; }));
   };

   var mapdata = function(dst, rc) {
      return  _.map(JSON.parse(rc.split('|')[4]), 
         function(dstname, i) { 
            d = JSON.parse(rc.split('|')[2])[i];
            var opt = dst.dst()[i].option || '{}';
            try {
               opt = JSON.parse(opt);
            } catch (e) { 
               //could not parse option json
               opt = {};
            } 
            return {
               name: dst.dst()[i].name, 
               label: dst.dst()[i].label, 
               val: d,
               curr: ko.observable(d),
               type : opt.type,
               options : opt.options,
               isselect : opt.type === 'select' && dst.canupdate(),
               isdate : opt.type === 'date' && dst.canupdate(),
               istext : ((opt.type === 'text' || !opt.type) && dst.canupdate())
            };
         }
      );
   };

   var getfirstdata = function(id, dst) {
      var c = '|C|getrec|' +
         dst.lib + '|' +
         id + '|' +
         mapObjKeyToJson(dst.dst(), 'name');

      rc = top.topFrame.BUIControl.callMIS(c, '');
      gcc.data.stat(rc);
      return mapdata(dst, rc);
   };

   var getpreviousdata = function(dst) {
      var c = '|C|getnextrec|' + 
         dst.lib + '|' + 
         mapObjKeyToJson(dst.dst(), 'name');

      rc = top.topFrame.BUIControl.callMIS(c, '');
      gcc.data.stat(rc);
      return mapdata(dst, rc);
      //var data = _.map(JSON.parse(rc.split('|')[4]), 
      //   function(dstname, i) { 
      //      d = JSON.parse(rc.split('|')[2])[i];
      //      var opt = dst.dst()[i].option || '{}';
      //      opt = JSON.parse(opt);
      //      return {
      //         name: dst.dst()[i].name, 
      //         label: dst.dst()[i].label, 
      //         val: d,
      //         curr: ko.observable(d),
      //         type : opt.type,
      //         options : opt.options,
      //         isselect : opt.type === 'select' && dst.canupdate(),
      //         isdate : opt.type === 'date' && dst.canupdate(),
      //         istext : ((opt.type === 'text' || !opt.type) && dst.canupdate())
      //      };
      //   }
      //);
      //return data;
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
      gcc.data.stat(c);
      rc = top.topFrame.BUIControl.callMIS(c, '');
      gcc.data.stat(rc);
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
      var c = _.map(dstgroup.dst(), function(d, i) {
            //d.val = '';
            //d.curr('');
            //return d;
            var dgroup = dstgroup.dst()[i];
            var opt = dstgroup.dst()[i].option || '{}';
            opt = JSON.parse(opt);
            return {
               val: '',
               curr: ko.observable(''),
               name: d.name,
               label: d.label,
               type : opt.type,
               options : opt.options,
               isselect : opt.type === 'select' && dstgroup.canupdate(),
               isdate : opt.type === 'date' && dstgroup.canupdate(),
               istext : ((opt.type === 'text' || !opt.type) && dstgroup.canupdate())
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
      getfirstdata(gcc.data.id, dstgroup);
      //dstgroup.val = dstgroup.curr();
   };

   gcc.data.save = function(dstgroup) {
      getfirstdata(gcc.data.id, dstgroup);
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
