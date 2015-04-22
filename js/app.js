(function (window, document, $) {

    var app = {};

    app._cy = null;
    app.showGraph = showGraph;
    app.readData = readData;
    app.start = start;

    app.start();

    function start() {
        var attrsNames = ['Attribute_1', 'Attribute_2', 'Attribute_3', 'Attribute_4'];

        app.readData('data/iris.random.data').then(function (data) {
            //data = randomData(data);
            var testData = data.splice(50, 50);
            var desiredOutputNames = getDesireOutputNames(data);
            var attrConfig = getAttributeConfig(attrsNames, data);
            var ci = new CIDecisionTree(data, attrConfig, desiredOutputNames);
            app.showGraph(ci.graphNodes, ci.graphEdges);

            ///////////

            function randomData(data) {
                var r = [];
                while (data.length > 0) {
                    var index = Math.round(Math.random() * (data.length - 1));
                    r.push(data.splice(index, 1)[0]);
                }

                var aa = r.map(function (line) {
                    return line.join(',');
                })
                var ab = aa.join('\n');
                console.log(ab);

                return r;

            }

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
                            { name: "5.5-6.2", min: 5.5, max: 6.2 },
                            { name: ">=6.3", min: 6.3, max: Infinity }
                    ]
                }, {
                    name: 'Attribute_2',
                    index: 1,
                    classFilter: [
                            { name: "<=2.9", min: -Infinity, max: 2.9 },
                            { name: "3.0-3.3", min: 3, max: 3.3 },
                            { name: ">=3.4", min: 3.4, max: Infinity }
                    ]
                }, {
                    name: 'Attribute_3',
                    index: 2,
                    classFilter: [
                            { name: "<=2.9", min: -Infinity, max: 2.9 },
                            { name: "3.0-4.8", min: 3, max: 4.8 },
                            { name: ">=4.9", min: 4.9, max: Infinity }
                    ]
                }, {
                    name: 'Attribute_4',
                    index: 3,
                    classFilter: [
                            { name: "<=0.9", min: -Infinity, max: 0.9 },
                            { name: "1.0-1.7", min: 1, max: 1.7 },
                            { name: ">=1.8", min: 1.8, max: Infinity }
                    ]
                }];

                return attrs.map(function (attr, i) {

                    var d = data.map(function (a) {
                        return a[i];
                    });
                    var mean = findMean(d);
                    var sd = findSD(d);
                    var lowerBound = mean - sd;
                    var upperBound = mean + sd;

                    return {
                        name: attr,
                        index: i,
                        classFilter: [
                            { name: "<=" + lowerBound.toFixed(2), min: -Infinity, max: lowerBound },
                            { name: lowerBound.toFixed(2) + "-" + upperBound.toFixed(2), min: lowerBound, max: upperBound },
                            { name: ">" + upperBound.toFixed(2), min: upperBound, max: Infinity }
                        ]
                    };
                });
            }
        });
    }

    function showGraph(_nodes, _edges) {
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
        if (app._cy) {
            app._cy.destroy();
        }
        app._cy = cytoscape({
            container: document.getElementById('cy'),

            style: cytoscape.stylesheet()
                .selector('node')
                .css({
                    'content': 'data(title)',
                    'background-color': '#aaa'
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
                padding: 20
            }
        });

        var bfs = app._cy.elements().bfs('#' + _nodes[0]['id'], function () {
        }, true);
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
            deferred.resolve(r);
        });
        return deferred.promise();
    }

    ////////////

    function CIDecisionTree(data, attributes, desiredOutput) {
        var self = this;
        self.data = data || [];
        self.attrs = attributes || [];
        self.desiredOutput = desiredOutput || [];
        self.graphNodes = [];
        self.graphEdges = [];

        findNode(data, []);

        self.graphNodes = $.unique(self.graphNodes);

        function findNode(data, prevAttrNames, prevNodeId) {
            var _prevAttrNames = prevAttrNames.slice(0);
            if (data.length == 0)
                return;
            var info = getPrimaryInfo(data);
            var maxGainAttr = findMaxGain(data, info, _prevAttrNames);
            if (maxGainAttr) {
                _prevAttrNames.push(maxGainAttr.attr.name);
                var maxGainAttrNodeId = maxGainAttr.attr.name + (prevNodeId ? Math.random() : '');
                addGraphNode(maxGainAttrNodeId, maxGainAttr.attr.name, 'attr');
                if (prevNodeId) {
                    addGraphEdge(prevNodeId, maxGainAttrNodeId);
                }
                maxGainAttr.summary.forEach(function (sm) {
                    var smNodeId = sm.classInfo.name + Math.random();
                    addGraphNode(smNodeId, sm.classInfo.name, 'condition');
                    addGraphEdge(maxGainAttrNodeId, smNodeId);

                    var filtered = sm.counts.filter(function (e) {
                        return e.value > 0;
                    });
                    if (filtered.length == 0) {
                        var unkId = 'unknown' + Math.random();
                        addGraphNode(unkId, 'unknown', 'unknown');
                        addGraphEdge(smNodeId, unkId);
                    } else if (filtered.length == 1) {
                        var detail = filtered[0];
                        var desired = detail.desired;
                        var dsId = smNodeId + desired;
                        addGraphNode(dsId, desired, 'result');
                        addGraphEdge(smNodeId, dsId);
                    } else {
                        var tempData = data.filter(function (item) {
                            return checkRangeCondition(item[maxGainAttr.attr.index], sm.classInfo.min, sm.classInfo.max);
                        });
                        findNode(tempData, _prevAttrNames, smNodeId);
                    }
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
                return {
                    attr: attr,
                    gain: gain
                };
            });
            gains.sort(function (a, b) {
                return a.gain.value < b.gain.value;
            });
            if (gains.length > 0) {
                gains[0].summary = gains[0].gain.summary;
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
                summary: attrInfo.summary
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
                sum += (classCount / data.length) * classI;
                summary.push({
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
    }

    window.app = app;
}(window, document, jQuery));