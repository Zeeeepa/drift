//! Call graph benchmarks — build + BFS traversal.

use criterion::{criterion_group, criterion_main, Criterion};
use drift_analysis::call_graph::builder::CallGraphBuilder;
use drift_analysis::parsers::types::{CallSite, FunctionInfo, ParseResult};
use drift_analysis::scanner::language_detect::Language;

/// Generate synthetic parse results with N files, each having M functions and K call sites.
fn generate_parse_results(num_files: usize, funcs_per_file: usize, calls_per_file: usize) -> Vec<ParseResult> {
    (0..num_files)
        .map(|i| {
            let file = format!("src/module_{i}.ts");
            let functions: Vec<FunctionInfo> = (0..funcs_per_file)
                .map(|j| FunctionInfo {
                    name: format!("func_{i}_{j}"),
                    qualified_name: Some(format!("module_{i}.func_{i}_{j}")),
                    line: (j * 10) as u32,
                    end_line: ((j * 10) + 8) as u32,
                    is_exported: j == 0,
                    is_async: false,
                    parameters: vec![],
                    return_type: None,
                    decorators: vec![],
                    complexity: 1,
                    cognitive_complexity: 1,
                    body_hash: String::new(),
                })
                .collect();
            let call_sites: Vec<CallSite> = (0..calls_per_file)
                .map(|k| {
                    let target_file = (i + 1) % num_files;
                    let target_func = k % funcs_per_file;
                    CallSite {
                        function_name: format!("func_{target_file}_{target_func}"),
                        receiver: None,
                        line: (k * 5) as u32,
                        column: 4,
                        arguments: vec![],
                        is_async: false,
                    }
                })
                .collect();
            ParseResult {
                file,
                language: Language::TypeScript,
                functions,
                call_sites,
                imports: vec![],
                exports: vec![],
                classes: vec![],
                type_aliases: vec![],
                ..Default::default()
            }
        })
        .collect()
}

fn call_graph_build_benchmark(c: &mut Criterion) {
    let small = generate_parse_results(10, 5, 8);
    let medium = generate_parse_results(50, 10, 20);

    c.bench_function("call_graph_build_10_files", |b| {
        b.iter(|| {
            let builder = CallGraphBuilder::new();
            std::hint::black_box(builder.build(&small))
        });
    });

    c.bench_function("call_graph_build_50_files", |b| {
        b.iter(|| {
            let builder = CallGraphBuilder::new();
            std::hint::black_box(builder.build(&medium))
        });
    });
}

fn call_graph_bfs_benchmark(c: &mut Criterion) {
    let parse_results = generate_parse_results(20, 8, 15);
    let builder = CallGraphBuilder::new();
    let (graph, _stats) = builder.build(&parse_results).expect("build should succeed");

    c.bench_function("call_graph_bfs_traversal", |b| {
        b.iter(|| {
            // BFS from the first node if any exist
            if graph.graph.node_count() > 0 {
                let start = petgraph::graph::NodeIndex::new(0);
                let bfs: Vec<_> = petgraph::visit::Bfs::new(&graph.graph, start)
                    .iter(&graph.graph)
                    .collect();
                std::hint::black_box(bfs)
            } else {
                std::hint::black_box(vec![])
            }
        });
    });
}

criterion_group!(benches, call_graph_build_benchmark, call_graph_bfs_benchmark);
criterion_main!(benches);
