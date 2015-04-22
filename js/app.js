(function (window, document, $) {

    var app = {};

    app.showGraph = showGraph;
    app.readData = readData;
    app.start = start;
    app.exampleData = exampleData;
    app.parseData = parseData;
    app.log = {
        $e: $('#logContent'),
        message: function (t) {
            this.$e.append(t);
        },
        title: function (t, className) {
            this.message('<div class="text-title ' + (className || '') + '">' + t + '</div>');
        },
        line: function(t, tag, className){
            var self = this;
            tag = tag ? tag : 'div';
            t = Array.isArray(t) ? t : [t];
            t.forEach(function (a) {
                self.message('<' + tag + ' class="' + (className || '') +  '">' + a + '</' + tag + '>');
            });
        },
        table: function(data,header, className, numberOrdered){
            //app.log.line(data.map(function (line) {return line.join(',');}).join('\n'), 'pre');
            var msg = '<table class="table ' + (className || '') + '">';
            msg += '<thead>';
            msg += '<tr>';
            if (numberOrdered) {
                msg += '<th>ลำดับที่</th>';
            }
            for (var i in header) {
                msg += '<th>' + header[i] + '</th>';
            }
            msg += '</tr>';
            msg += '</thead>';
            msg += '<tbody>';
            for (var i in data) {
                msg += '<tr>';
                if (numberOrdered) {
                    msg += '<td>' + (Number(i) + 1) + '</td>';
                }
                for (var j in data[i]) {
                    msg += '<td>' + data[i][j] + '</td>';
                }
                msg += '</tr>';
            }
            msg += '</tbody>';
            msg += '</table>';
            this.message(msg);
        },
    };

    function exampleData() {
        return app.readData('data/iris.random.data').then(function (data) {
            data = randomData(data);
            return data;
        });
    }
    function start(data, section) {
        app.log.$e.empty();
        var attrsNames = (function () {
            var names = [];
            data[0].forEach(function (e, i) {
                names.push('Attribute_' + (i+1));
            });
            names.pop();
            return names;
        }());

        app.log.title('Dataset ที่ใช้');
        var logAttrNames = attrsNames.slice(0);
        logAttrNames.push('Class');
        app.log.table(data, logAttrNames, 'table-bordered table-striped', true);

        var testData = data.splice(50 * section, 50);
        var desiredOutputNames = getDesireOutputNames(data);
        var attrConfig = getAttributeConfig(attrsNames, data);

        app.log.title('สร้าง DT แบบ 3 Fold Cross Validation');
        app.log.line('กำหนดให้');
        app.log.line(' Class A : Iris-setosa \n Class B : Iris-versicolor \n Class C : Iris-virginica', 'pre');
        app.log.message('<hr/>');

        app.log.title('ทำ Cross Validation ที่ ' + (section + 1));
        app.log.line('นำข้อมูลจาก Dataset ลำดับที่ ' + (section * 50 + 1) + ' - ' + (section * 50 + 50) + ' มาทำการทดสอบ และใช้ Dataset ที่เหลือในการสร้าง DT จะได้');
        app.log.message('<hr/>');

        var ci = new CIDecisionTree(data, testData, attrConfig, desiredOutputNames);
        app.showGraph(ci.graphNodes, ci.graphEdges);

        ///////////

        function getDesireOutputNames(data) {
            var r = data.map(function (line) {
                var desireOutputIndex = line.length - 1;
                return line[desireOutputIndex];
            });
            r = $.unique(r);
            r.sort();
            return r;
        }

        function getAttributeConfig(attrs, data) {
            return [{
                name: 'Attribute_1',
                index: 0,
                classFilter: [
                        { name: "<=5.4", min: -Infinity, max: 5.4 },
                        { name: "5.5 ถึง 6.2", min: 5.5, max: 6.2 },
                        { name: ">=6.3", min: 6.3, max: Infinity }
                ]
            }, {
                name: 'Attribute_2',
                index: 1,
                classFilter: [
                        { name: "<=2.9", min: -Infinity, max: 2.9 },
                        { name: "3.0 ถึง 3.3", min: 3, max: 3.3 },
                        { name: ">=3.4", min: 3.4, max: Infinity }
                ]
            }, {
                name: 'Attribute_3',
                index: 2,
                classFilter: [
                        { name: "<=2.9", min: -Infinity, max: 2.9 },
                        { name: "3.0 ถึง 4.8", min: 3, max: 4.8 },
                        { name: ">=4.9", min: 4.9, max: Infinity }
                ]
            }, {
                name: 'Attribute_4',
                index: 3,
                classFilter: [
                        { name: "<=0.9", min: -Infinity, max: 0.9 },
                        { name: "1.0 ถึง 1.7", min: 1, max: 1.7 },
                        { name: ">=1.8", min: 1.8, max: Infinity }
                ]
            }];

            //return attrs.map(function (attr, i) {

            //    var d = data.map(function (a) {
            //        return a[i];
            //    });
            //    var mean = findMean(d);
            //    var sd = findSD(d);
            //    var lowerBound = mean - sd;
            //    var upperBound = mean + sd;

            //    return {
            //        name: attr,
            //        index: i,
            //        classFilter: [
            //            { name: "<=" + lowerBound.toFixed(2), min: -Infinity, max: lowerBound },
            //            { name: lowerBound.toFixed(2) + " ถึง " + upperBound.toFixed(2), min: lowerBound, max: upperBound },
            //            { name: ">" + upperBound.toFixed(2), min: upperBound, max: Infinity }
            //        ]
            //    };
            //});
        }
    }

    function randomData(data) {
        var r = [];
        while (data.length > 0) {
            var index = Math.round(Math.random() * (data.length - 1));
            r.push(data.splice(index, 1)[0]);
        }

        return r;

    }

    function showGraph(_nodes, _edges, selector) {
        var nodes = _nodes.map(function (n) {
            var a = { data: { id: n.id, title: n.title } };
            for (var i in n) {
                if (i !== "id" && i !== "title") {
                    a[i] = n[i];
                }
            }
            return a;
        });
        var edges = _edges.map(function (e) {
            var a = { data: { id: e.source + e.target, source: e.source, target: e.target } };
            for (var i in e) {
                if (i !== "source" && i !== "target") {
                    a[i] = e[i];
                }
            }
            return a;
        });

        var cy = cytoscape({
            container: document.getElementById(selector || 'cy'),
            wheelSensitivity: 0.07,
            style: cytoscape.stylesheet()
                .selector('node')
                .css({
                    'content': 'data(title)',
                    'background-color': '#aaa',
                })
                .selector('edge')
                .css({
                    'target-arrow-shape': 'triangle',
                    'width': 2,
                    'line-color': '#d0d0d0',
                    'target-arrow-color': '#d0d0d0'
                })
                .selector('.attr')
                .css({
                    'background-color': '#03A9F4',
                    'line-color': '#03A9F4',
                    'target-arrow-color': '#03A9F4',
                    'transition-property': 'background-color, line-color, target-arrow-color',
                    'transition-duration': '0.5s',
                })
                .selector('.condition')
                .css({
                    'background-color': '#F57C00',
                })
                .selector('.result')
                .css({
                    'background-color': '#E91E63',
                })
                .selector('.unknown')
                .css({
                    'background-color': '#607D8B',
                }),
            elements: {
                nodes: nodes,

                edges: edges
            },

            layout: {
                name: 'breadthfirst',
                directed: true,
                roots: '#' + _nodes[0]['id'],
                padding: 20,
                avoidOverlap: true,
            }
        });

        var bfs = cy.elements().bfs('#' + _nodes[0]['id'], function () { }, true);
    }

    function sumArray(data) {
        return data.reduce(function (a, b) {
            return a + b;
        });
    }

    function findMean(data) {
        return sumArray(data) / data.length;
    }

    function findSD(data) {
        var mean = findMean(data);
        var sum = data.reduce(function (a, b) {
            return a + Math.pow(b - mean, 2);
        }, 0);
        return Math.sqrt(sum / (data.length - 1));
    }

    function readData(path) {
        var deferred = $.Deferred();
        $.get(path).success(function (data) {
            deferred.resolve(parseData(data));
        });
        return deferred.promise();
    }

    function parseData(data) {
        var r = data.split('\n').map(function (line) {
            return line.split(',').map(function (a) {
                if (a === "")
                    return a;
                if (isNaN(Number(a))) {
                    return a;
                }
                return Number(a);
            })
        }).filter(function (a) {
            return a.every(function (attr) {
                return attr !== "";
            });
        });
        return r;
    }


    ////////////

    function CIDecisionTree(data, testData, attributes, desiredOutput) {
        var self = this;
        self.data = data || [];
        self.testData = testData || [];
        self.attrs = attributes || [];
        self.desiredOutput = desiredOutput || [];
        self.graphNodes = [];
        self.graphEdges = [];
        self.root = null;

        findNode(1, data, [], []);

        self.graphNodes = $.unique(self.graphNodes);

        var result = doTestData();

        app.log.title('ผลสรุป');
        app.log.table((function () {
            return self.desiredOutput.map(function (key) {
                return [].concat(key).concat((function () {
                    return self.desiredOutput.map(function (k) {
                        return result.map[key][k] || 0;
                    });
                }()));
            });
        }()), ['Desired Output \ Test Output'].concat(self.desiredOutput), 'table-bordered');
        app.log.title('จากการทดสอบพบว่ามีเปอร์เซ็นต์ความถูกต้องเท่ากับ <span class="text-primary">' + ((result.correct * 100 / result.n).toFixed(2)) + ' %</span> ซึ่งเป็นผลการทดลองที่' + (result.correct == result.n ? '' : 'ค่อนข้าง') + 'ดี เนื่องจาก' + (result.n == (result.correct + result.unknown) ? 'ไม่มีความผิดพลาด' : ('มีความผิดพลาดเพียง <span class="text-danger">' + (((result.n - result.correct - result.unknown) * 100 / result.n).toFixed(2)) + '%</span>')) + (result.unknown == 0 ? 'และไม่มีที่ระบุคราสไม่ได้' : (' และระบุ Class ไม่ได้เพียง <span class="text-unknown">' + ((result.unknown * 100 / result.n).toFixed(2)) + ' %</span> เท่านั้น ')), 'well');

        function findNode(level, data, prevAttrNames, prevFilters, prevNode) {

            if (data.length == 0)
                return;

            var _prevAttrNames = prevAttrNames.slice(0);
            var _prevFilters = prevFilters.slice(0);

            var info = getPrimaryInfo(data);
            var tCounts = countDesiredOutput(data);

            app.log.title('หาค่า Gain สูงสุด' + (_prevFilters.length === 0 ? 'รอบแรก' : ' โดยที่ ' + (function () {
                return _prevFilters.join(' และ ');
            }())), 'well');
            app.log.line('Info(D) = I(A,B,C) = I(' + tCounts.join(',') + ') = ' + info.toFixed(4), 'pre');
            app.log.message('<hr/>');

            var maxGainAttr = findMaxGain(data, info, _prevAttrNames);
            if (maxGainAttr) {

                if (!self.root) {
                    self.root = maxGainAttr;
                }
                if (prevNode) {
                    prevNode.next = maxGainAttr;
                }

                _prevAttrNames.push(maxGainAttr.attr.name);

                var maxGainAttrNodeId = maxGainAttr.attr.name + (prevNode ? Math.random() : '');
                addGraphNode(maxGainAttrNodeId, maxGainAttr.attr.name, 'attr');
                if (prevNode && prevNode.smNodeId) {
                    addGraphEdge(prevNode.smNodeId, maxGainAttrNodeId);
                }

                maxGainAttr.gain.summary.forEach(function (sm) {
                    var smNodeId = sm.classInfo.name + Math.random();
                    addGraphNode(smNodeId, sm.classInfo.name, 'condition');
                    addGraphEdge(maxGainAttrNodeId, smNodeId);
                    sm.smNodeId = smNodeId;
                });


                var callbackFindNodes = [];
                maxGainAttr.gain.summary.forEach(function (sm) {
                    var smNodeId = sm.smNodeId;
                    var filtered = sm.counts.filter(function (e) {
                        return e.value > 0;
                    });
                    if (filtered.length == 0) {
                        var unkId = 'unknown' + Math.random();
                        sm.next = 'unknown';
                        addGraphNode(unkId, 'unknown', 'unknown');
                        addGraphEdge(smNodeId, unkId);
                    } else if (filtered.length == 1) {
                        var detail = filtered[0];
                        var desired = detail.desired;
                        var dsId = smNodeId + desired;
                        sm.next = desired;
                        addGraphNode(dsId, desired, 'result');
                        addGraphEdge(smNodeId, dsId);
                    } else {
                        if (_prevAttrNames.length < self.attrs.length) {
                            var tempData = data.filter(function (item) {
                                return checkRangeCondition(item[maxGainAttr.attr.index], sm.classInfo.min, sm.classInfo.max);
                            });

                            var _tempPrevFilter = _prevFilters.slice(0);
                            _tempPrevFilter.push(maxGainAttr.attr.name + ' มีค่า ' + sm.classInfo.name);

                            callbackFindNodes.push([level + 1, tempData, _prevAttrNames, _tempPrevFilter, sm]);
                        }
                        else {
                            var counts = sm.counts.slice(0);
                            counts.sort(function (a, b) {
                                return a.value < b.value;
                            });
                            var desired = counts[0].desired;
                            var dsId = smNodeId + desired;
                            sm.next = desired;
                            addGraphNode(dsId, desired, 'result');
                            addGraphEdge(smNodeId, dsId);
                        }
                    }
                });

                (function graphLog() {
                    var _logGraphNodes = $.unique(self.graphNodes);
                    var _logGraphEdgess = self.graphEdges.slice(0);
                    if (_logGraphNodes.length > 0) {
                        var _cyId = 'cy' + Math.random();
                        var $d = $('<div class="cy-log"/>').attr('id', _cyId);
                        $d.css('height', 400 + (level * 90));
                        app.log.message($d);
                        showGraph(_logGraphNodes, _logGraphEdgess, _cyId);
                        app.log.message('<hr/>');
                    }
                }());

                callbackFindNodes.forEach(function (args) {
                    findNode.apply(self, args);
                });
            }
        }

        function addGraphNode(id, title, classes) {
            self.graphNodes.push({
                id: id,
                title: title,
                classes: classes
            });
        }

        function addGraphEdge(s, t) {
            self.graphEdges.push({
                source: s,
                target: t
            });
        }

        function checkRangeCondition(value, min, max) {
            return value >= min && value <= max;
        }

        function findMaxGain(data, info, prevAttrNames) {
            var gains = self.attrs.filter(function (attr) {
                return prevAttrNames.indexOf(attr.name) === -1;
            }).map(function (attr, i) {
                var gain = calGain(data, attr, info);

                var logTableHeader = [attr.name, 'A', 'B', 'C', 'I(A,B,C)'];
                var logTableData = gain.summary.map(function (sm) {
                    return [sm.classInfo.name, sm.counts[0].value, sm.counts[1].value, sm.counts[2].value, sm.value.toFixed(4)];
                });
                app.log.line('หาค่า Gain ของ ' + attr.name, 'div', 'text-headsub');
                app.log.table(logTableData, logTableHeader, 'table-bordered');
                app.log.line(
                    'Info<sub>' + attr.name + '</sub>(D)   = ' + (function () {
                        return gain.summary.map(function (sm) {
                            return sm.value.toFixed(4);
                        }).join(' + ');
                    }()) + ' = ' + gain.attrInfo.toFixed(4) +
                    '\n' +
                    'Gain(' + attr.name + ') = ' + info.toFixed(4) + ' - ' + gain.attrInfo.toFixed(4) + ' = ' + gain.value.toFixed(4), 'pre');
                app.log.message('<hr/>');

                return {
                    attr: attr,
                    gain: gain
                };
            });
            gains.sort(function (a, b) {
                return a.gain.value < b.gain.value;
            });
            
            (function logDupplicatedValues() {
                var dupplicatedValues = (function () {
                    var r = [];
                    var map = {};
                    gains.forEach(function (g) {
                        var key = String(g.gain.value);
                        if (!map[key]) {
                            map[key] = 1;
                        } else {
                            map[key]++;
                        }
                    });
                    for (var i in map) {
                        if (map[i] >= 2) {
                            r = r.concat(gains.filter(function (g) {
                                return g.gain.value === Number(i);
                            }));
                        }
                    }
                    return r;
                }());

                if (dupplicatedValues.length > 0) {
                    app.log.line('เนื่องจาก Gain ของ ' + (function () {
                        return dupplicatedValues.map(function (g) {
                            return g.attr.name
                        }).join(', ');
                    }()) + ' มีค่าเท่ากัน จึงเลือก ' + gains[0].attr.name + (prevAttrNames.length == 0 ? ' เป็น root ของ DT' : '') + ' จะได้', 'div', 'text-headsub');
                } else {
                    app.log.line('เนื่องจาก Gain ของ ' + gains[0].attr.name + ' มากที่สุด จึงเลือก ' + gains[0].attr.name + (prevAttrNames.length == 0 ? ' เป็น root ของ DT' : '' ) + ' จะได้', 'div', 'text-headsub');
                }
            }());

            if (gains.length > 0) {
                return gains[0];
            }
            return null;
        }

        function getPrimaryInfo(data) {
            var counts = countDesiredOutput(data);
            return calI(counts);
        }

        function countDesiredOutput(data){
            return self.desiredOutput.map(function (desired, i) {
                return filterDesiredOutput(data, desired).length;
            });
        }


        function filterDesiredOutput(data, desired) {
            return data.filter(function (e) {
                return getDesiredOutputFromItem(e) == desired;
            });
        }

        function getDesiredOutputFromItem(item) {
            return item[item.length - 1];
        }

        function calGain(data, attr, info) {
            var attrInfo = calInfo(data, attr);
            return {
                value: info - attrInfo.value,
                summary: attrInfo.summary,
                attrInfo: attrInfo.value,
            };
        }

        function calInfo(data, attr) {
            var sum = 0;
            var summary = [];
            attr.classFilter.forEach(function (config) {
                var filteredData = data.filter(function (item) {
                    return checkRangeCondition(item[attr.index], config.min, config.max);
                });
                var classI = getPrimaryInfo(filteredData);
                var countsDesired = countDesiredOutput(filteredData);
                var classCount = sumArray(countsDesired);
                var value = (classCount / data.length) * classI;
                sum += value;
                summary.push({
                    value: value,
                    classInfo: config,
                    counts: countsDesired.map(function(cd, i){
                        return {
                            desired: self.desiredOutput[i],
                            index: i,
                            value: cd
                        };
                    })
                });
            });
            return {
                value: sum,
                summary: summary
            };
        }

        function calI(args) {
            args = args.filter(function (a) {
                return a != 0;
            });
            if (args.length === 0) {
                return 0;
            }
            var n = sumArray(args);
            return args.reduce(function (a, b) {
                return a + calItemI(b, n);
            }, 0);
        }

        function calItemI(v, n) {
            return -1 * (v / n) * Math.log2(v / n);
        }

        function getAttributeName(index) {
            return this.attributes[index];
        }

        function doTestData() {
            var root = self.root;
            var testData = self.testData;
            var data = self.data;
            var map = {};
            testData.forEach(function (tr) {
                var desired = getDesiredOutputFromItem(tr);
                if (!map[desired])
                    map[desired] = {};

                var output = getItemResultFromTree(tr);
                if (!map[desired][output])
                    map[desired][output] = 0;
                map[desired][output]++;
            });

            var correct = 0;
            self.desiredOutput.forEach(function (ds) {
                correct += map[ds][ds];
            });

            return {
                correct: correct,
                unknown: self.desiredOutput.map(function(ds){
                    return map[ds]['unknown'] || 0;
                }).reduce(function (a, b) { return a + b }, 0),
                n: testData.length,
                map: map
            };

            function getItemResultFromTree(item) {
                var root = self.root;
                while (typeof (root) === 'object') {
                    var smIndex = 0;
                    root.gain.summary.forEach(function (sm, i) {
                        if (checkRangeCondition(item[root.attr.index], sm.classInfo.min, sm.classInfo.max)) {
                            smIndex = i;
                            return;
                        }
                    });
                    root = root.gain.summary[smIndex].next;
                }
                return root;
            }
        }
    }

    window.app = app;
}(window, document, jQuery));