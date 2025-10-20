# Makefile for Rust event sourcing project

.PHONY: build test clean run check all

# Default target
all: check test

# Build the project
build:
	cargo build

# Build in release mode
release:
	cargo build --release

# Run tests
test:
	cargo test

# Run tests with output
test-verbose:
	cargo test -- --nocapture

# Check code without building
check:
	cargo check

# Format code
fmt:
	cargo fmt

# Run linter
lint:
	cargo clippy

# Clean build artifacts
clean:
	cargo clean

# Run the library tests
run: test
