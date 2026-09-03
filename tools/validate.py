#!/usr/bin/env python3
"""
Validates res/raw/watchface.xml against Google's official Watch Face Format
schema, before you ever wait on a Gradle build.

    pip install xmlschema
    python3 tools/validate.py

The schemas live in github.com/google/watchface; this fetches a shallow clone
into .wff-spec/ (gitignored) on first run. They use XSD 1.1, so xmllint cannot
compile them - hence xmlschema's XMLSchema11 rather than libxml2.

The format version is read from AndroidManifest.xml so the two can never drift.
"""
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SPEC = os.path.join(ROOT, ".wff-spec")
SPEC_REPO = "https://github.com/google/watchface.git"
WATCHFACE_XML = os.path.join(ROOT, "watchface", "src", "main", "res", "raw", "watchface.xml")
MANIFEST = os.path.join(ROOT, "watchface", "src", "main", "AndroidManifest.xml")


def format_version():
    text = open(MANIFEST).read()
    m = re.search(
        r'com\.google\.wear\.watchface\.format\.version"\s*\n?\s*android:value="(\d+)"', text)
    if not m:
        sys.exit("could not read the format version property from AndroidManifest.xml")
    return m.group(1)


def ensure_spec():
    if os.path.isdir(SPEC):
        return
    print(f"fetching the WFF specification into {SPEC} ...")
    subprocess.run(["git", "clone", "--depth", "1", SPEC_REPO, SPEC], check=True)


def main():
    try:
        import xmlschema
    except ImportError:
        sys.exit("missing dependency: pip install xmlschema")

    ensure_spec()
    version = format_version()
    schema = os.path.join(SPEC, "third_party", "wff", "specification",
                          "documents", version, "watchface.xsd")
    if not os.path.exists(schema):
        sys.exit(f"no schema for format version {version} at {schema}")

    errors = list(xmlschema.XMLSchema11(schema).iter_errors(WATCHFACE_XML))
    if not errors:
        print(f"watchface.xml is valid against Watch Face Format v{version}")
        return 0

    print(f"{len(errors)} error(s) against Watch Face Format v{version}:\n")
    for e in errors:
        print(f"  {e.path}\n    {e.reason}\n")
    return 1


if __name__ == "__main__":
    sys.exit(main())
