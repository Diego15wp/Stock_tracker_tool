'use client';

import {Label} from '@/components/ui/label';
import {Controller} from "react-hook-form";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {Button} from "@/components/ui/button";
import countryList from 'react-select-country-list';
import { useState, useMemo } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import {cn} from '@/lib/utils';

const getCountryCode = (countryName: string): string => {
  const list = countryList();
  return list.getValue(countryName) || '';
};

const getCountryFlag = (countryCode: string): string => {
  if (!countryCode) return '';
  return countryCode
    .toUpperCase()
    .split('')
    .map(char => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join('');
};
const CountrySelectField = ({name, label, control, error, required=false}:CountrySelectProps) => {
    const countries = countryList().getLabels();
    const [open, setOpen] = useState(false);
    const [searchValue, setSearchValue] = useState('');

    const countriesWithFlags = useMemo(() => {
      return countries.map(country => ({
        name: country,
        code: getCountryCode(country),
        flag: getCountryFlag(getCountryCode(country))
      }));
    }, [countries]);

    return (
        <div className="space-y-2">
            <Label htmlFor={name} className="form-label">
                {label}
            </Label>
            
            <Controller
                name={name}
                control={control}
                rules={required ? { required: `${label} is required` } : {}}
                render={({ field }) => {
                    const selectedCountry = countriesWithFlags.find(c => c.name === field.value);
                    
                    return (
                    <div className="space-y-2">
                        <Popover open={open} onOpenChange={setOpen}>
                            <PopoverTrigger className="border-gray-600" asChild>
                                <Button
                                    id={name}
                                    variant="ghost"
                                    role="combobox"
                                    aria-expanded={open}
                                    className="country-select-trigger"
                                >
                                    {selectedCountry ? (
                                        <span className="flex items-center gap-2">
                                            <span className="text-2xl">{selectedCountry.flag}</span>
                                            {selectedCountry.name}
                                        </span>
                                    ) : (
                                        <span className="text-gray-400">{`Select a ${label.toLowerCase()}...`}</span>
                                    )}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] border-gray-600 bg-gray-800 text-white rounded-lg p-0" align="start">
                                <Command className="bg-gray-800 border-gray-600">
                                    <CommandInput 
                                        placeholder={`Search ${label.toLowerCase()}...`}
                                        value={searchValue}
                                        onValueChange={setSearchValue}
                                        className="country-select-input"
                                    />
                                    <CommandEmpty className="country-select-empty">No countries found.</CommandEmpty>
                                    <CommandList className="max-h-64 bg-gray-800 scrollbar-hide-default">
                                        <CommandGroup className='bg-gray-800'>
                                            {countriesWithFlags
                                                .filter(item =>
                                                    searchValue === '' || 
                                                    item.name.toLowerCase().includes(searchValue.toLowerCase())
                                                )
                                                .map((item) => (
                                                    <CommandItem
                                                        key={item.code}
                                                        value={item.name}
                                                        onSelect={(value) => {
                                                            field.onChange(value);
                                                            setOpen(false);
                                                            setSearchValue('');
                                                        }}
                                                        
                                                        className="country-select-item"
                                                    >
                                                        <Check
                                                            className={cn(`mr-2 h-4 w-4 ${
                                                                field.value === item.name ? 'opacity-100' : 'opacity-0'
                                                            }`)}
                                                        />
                                                        <span className="text-2xl mr-2">{item.flag}</span>
                                                        {item.name}
                                                    </CommandItem>
                                                ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                    );
                }}
            />
            
            {error && (
                <p className="text-sm text-red-500">{error.message}</p>
            )}
        </div>
    );
}

export default CountrySelectField;