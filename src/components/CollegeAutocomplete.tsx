import { useEffect, useRef, useState } from "react";
import { search } from "aishe-institutions-list";
import { Input } from "@/components/ui/input";

interface CollegeRecord {
  name: string;
  city?: string;
  state?: string;
}

interface CollegeAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  inputId?: string;
  className?: string;
}

const MAX_RESULTS = 10;

const normalize = (value: string) => value.trim().toLowerCase();

const CollegeAutocomplete = ({ value, onChange, disabled, placeholder, inputId, className }: CollegeAutocompleteProps) => {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<CollegeRecord[]>([]);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const blurTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    return () => {
      if (blurTimeout.current) {
        clearTimeout(blurTimeout.current);
      }
    };
  }, []);

  const runSearch = (inputValue: string) => {
    const processedQuery = normalize(inputValue);
    if (processedQuery.length < 2) {
      setResults([]);
      setDropdownVisible(false);
      return;
    }

    try {
      const rawResults: CollegeRecord[] = search(processedQuery) ?? [];
      const uniqueResults = Array.from(new Map(rawResults.map((record) => [record.name, record])).values());

      const prefixMatches: CollegeRecord[] = [];
      const substringMatches: CollegeRecord[] = [];

      uniqueResults.forEach((record) => {
        const collegeName = record?.name ?? "";
        const normalizedName = collegeName.toLowerCase();

        if (normalizedName.startsWith(processedQuery)) {
          prefixMatches.push(record);
        } else if (normalizedName.includes(processedQuery)) {
          substringMatches.push(record);
        }
      });

      const sortedResults = [...prefixMatches, ...substringMatches].slice(0, MAX_RESULTS);
      setResults(sortedResults);
      setDropdownVisible(sortedResults.length > 0);
    } catch (error) {
      console.error("College search failed", error);
      setResults([]);
      setDropdownVisible(false);
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    setQuery(nextValue);
    onChange(nextValue);
    runSearch(nextValue);
  };

  const handleSelect = (college: CollegeRecord) => {
    const collegeName = college.name ?? "";
    setQuery(collegeName);
    onChange(collegeName);
    setDropdownVisible(false);
    setResults([]);
  };

  const handleBlur = () => {
    blurTimeout.current = setTimeout(() => setDropdownVisible(false), 100);
  };

  const handleFocus = () => {
    if (results.length > 0) {
      setDropdownVisible(true);
    }
  };

  return (
    <div className="relative">
      <Input
        id={inputId}
        className={className}
        type="text"
        value={query}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={disabled}
        placeholder={placeholder}
      />
      {dropdownVisible && results.length > 0 && (
        <div className="absolute z-10 mt-1 w-full rounded-md border bg-card shadow-lg">
          <ul className="max-h-60 overflow-auto p-1">
            {results.map((college) => (
              <li key={college.name}>
                <button
                  type="button"
                  className="flex w-full flex-col rounded-sm px-3 py-2 text-left text-sm hover:bg-muted"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handleSelect(college)}
                >
                  <span className="font-medium leading-tight">{college.name}</span>
                  {college.city && (
                    <span className="text-xs text-muted-foreground">
                      {college.city}
                      {college.state ? `, ${college.state}` : ""}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CollegeAutocomplete;
