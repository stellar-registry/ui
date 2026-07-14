import { useEffect, useState, type ChangeEventHandler } from "react"
import { useNavigationType, useSearchParams } from "react-router"

import { Input } from "./input"
import { useDebounced } from "~/hooks/useDebounce"

type QuerySearchInputProps = {
	placeholder: string
}

const QUERY_PARAM = "query"

export function QuerySearchInput({ placeholder }: QuerySearchInputProps) {
	const [searchParams, setSearchParams] = useSearchParams()
	const urlQuery = searchParams.get(QUERY_PARAM) ?? ""
	const [input, setInput] = useState(urlQuery)
	const debouncedInput = useDebounced(input, 300)
	const navigationType = useNavigationType()

	const inputOnChange: ChangeEventHandler<HTMLInputElement> = (e) => {
		setInput(e.target.value)
	}

	// Our own debounced write below always navigates with `replace: true`
	// (-> navigationType "REPLACE"), so any other urlQuery change is external
	// (back/forward, a shared link) and should overwrite the in-progress input.
	useEffect(() => {
		if (navigationType === "REPLACE") {
			return
		}

		setInput(urlQuery)
	}, [navigationType, urlQuery])

	useEffect(() => {
		if (debouncedInput === urlQuery) {
			return
		}

		const nextSearchParams = new URLSearchParams(searchParams)
		if (debouncedInput) {
			nextSearchParams.set(QUERY_PARAM, debouncedInput)
		} else {
			nextSearchParams.delete(QUERY_PARAM)
		}

		setSearchParams(nextSearchParams, { replace: true })
	}, [debouncedInput, searchParams, setSearchParams, urlQuery])

	return (
		<Input placeholder={placeholder} value={input} onChange={inputOnChange} />
	)
}
