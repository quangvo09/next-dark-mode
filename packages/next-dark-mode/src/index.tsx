import darkmodejs from '@assortment/darkmodejs'
import { NextComponentType } from 'next'
import { AppContext } from 'next/app'
import { parseCookies, setCookie } from 'nookies'
import React, { useEffect, useState } from 'react'

import { defaultConfig, Config, MODE } from './config'
import { DarkModeContext } from './darkModeContext'

interface AppProps {
  autoMode?: boolean
  darkMode?: boolean
  initialProps: any
}

export default (App: NextComponentType | any, config?: Partial<Config>) => {
  const { autoModeCookieName, darkModeCookieName, defaultMode, provider } = { ...defaultConfig, ...config }

  function DarkMode({ autoMode, darkMode, initialProps, ...props }: AppProps) {
    const [state, setState] = useState({
      autoModeActive: !!autoMode,
      autoModeSupported: false,
      browserMode: defaultMode,
      darkModeActive: !!darkMode,
      switchToAutoMode: () => {
        setState(state => {
          if (state.autoModeSupported) {
            setCookie(null, autoModeCookieName, '1', {})
            const darkModeActive = state.browserMode === MODE.DARK
            setCookie(null, darkModeCookieName, darkModeActive ? '1' : '0', {})

            return { ...state, autoModeActive: true, darkModeActive }
          }

          return { ...state }
        })
      },
      switchToDarkMode: () => {
        setState(state => ({ ...state, autoModeActive: false, darkModeActive: true }))
        setCookie(null, autoModeCookieName, '0', {})
        setCookie(null, darkModeCookieName, '1', {})
      },
      switchToLightMode: () => {
        setState(state => ({ ...state, autoModeActive: false, darkModeActive: false }))
        setCookie(null, autoModeCookieName, '0', {})
        setCookie(null, darkModeCookieName, '0', {})
      },
    })

    useEffect(() => {
      const { removeListeners } = darkmodejs({
        onChange: (activeTheme, themes) => {
          switch (activeTheme) {
            case themes.DARK:
              setState(state => {
                if (state.autoModeSupported) {
                  setCookie(null, darkModeCookieName, '1', {})
                  return { ...state, browserMode: MODE.DARK, darkModeActive: true }
                } else return { ...state, autoModeSupported: true, browserMode: MODE.DARK }
              })
              break
            case themes.LIGHT:
              setState(state => {
                if (state.autoModeSupported) {
                  setCookie(null, darkModeCookieName, '0', {})
                  return { ...state, browserMode: MODE.LIGHT, darkModeActive: false }
                } else return { ...state, autoModeSupported: true, browserMode: MODE.LIGHT }
              })
              break
            case themes.NO_PREF:
            case themes.NO_SUPP:
              setCookie(null, autoModeCookieName, '0', {})
              setState(state => ({ ...state, autoModeSupported: false }))
              break
          }
        },
      })

      return removeListeners
    }, [])

    const app = <App darkMode={state} {...props} {...initialProps} />

    return provider ? <DarkModeContext.Provider value={state}>{app}</DarkModeContext.Provider> : app
  }

  DarkMode.getInitialProps = async ({ Component, ctx }: AppContext) => {
    const initialProps = Component.getInitialProps ? await Component.getInitialProps(ctx) : {}

    if (typeof window === 'undefined') {
      const cookies = parseCookies(ctx)

      const autoModeCookie = cookies[autoModeCookieName]
      const darkModeCookie = cookies[darkModeCookieName]

      const autoMode = typeof autoModeCookie === 'undefined' ? true : autoModeCookie === '1'
      const darkMode = typeof darkModeCookie === 'undefined' ? defaultMode === MODE.DARK : darkModeCookie === '1'

      const autoModeString = autoMode ? '1' : '0'
      const darkModeString = darkMode ? '1' : '0'

      if (autoModeString !== autoModeCookie) setCookie(ctx, autoModeCookieName, autoModeString, {})
      if (darkModeString !== darkModeCookie) setCookie(ctx, darkModeCookieName, darkModeString, {})

      return { autoMode, darkMode, initialProps }
    }

    return { initialProps }
  }

  DarkMode.displayName = `withDarkMode(${App.displayName || App.name || 'App'})`

  return DarkMode
}

export { DarkModeContext }
